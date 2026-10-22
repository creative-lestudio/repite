import "server-only";
import webpush from "web-push";
import { parseLevels } from "@/domain/levels";
import { renderNotification, toSqlSegment, type Segment, type Variable } from "@/domain/notifications";
import { firstName } from "@/domain/templates";
import { createServiceClient } from "@/lib/supabase/server";
import { getLocationById } from "../repositories/locations";
import { pushApplePassUpdate } from "../wallet/apple";
import { appleConfig, googleConfig } from "../wallet/config";
import { sendGoogleMessage } from "../wallet/google";
import { passSerial } from "@/domain/wallet";
import { pushConfig } from "./config";

/** Ejecuta `fn` sobre cada elemento con un máximo de tareas a la vez. */
async function mapLimit<T>(items: T[], limit: number, fn: (item: T) => Promise<void>) {
  let i = 0;
  await Promise.all(
    Array.from({ length: Math.min(limit, items.length) }, async () => {
      while (i < items.length) {
        const item = items[i++]!;
        await fn(item).catch(() => {});
      }
    }),
  );
}

const chunk = <T>(a: T[], n: number) =>
  Array.from({ length: Math.ceil(a.length / n) }, (_, i) => a.slice(i * n, i * n + n));

interface AudienceRow {
  customer_id: string;
  name: string;
  balance: number;
  stamps_required: number | null;
  reward_name: string | null;
  has_apple: boolean;
  has_google: boolean;
  has_push: boolean;
}

/** Reparte una notificación ya creada: aviso en la tarjeta (siempre), Apple Wallet, Google Wallet y Web Push. */
export async function deliverNotification(notificationId: string): Promise<void> {
  const db = createServiceClient();
  const { data: n } = await db.from("notifications").select("*").eq("id", notificationId).maybeSingle();
  if (!n || n.status !== "sending") return;

  try {
    const location = await getLocationById(n.location_id);
    if (!location) throw new Error("location");
    const { data: program } = await db
      .from("loyalty_programs")
      .select("levels")
      .eq("organization_id", n.organization_id)
      .eq("active", true)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const sql = toSqlSegment(n.segment as unknown as Segment, parseLevels(program?.levels));
    const gap = Number(location.settings.message_min_days ?? 7);
    const { data, error } = sql
      ? await db.rpc("notification_audience", {
          p_org: n.organization_id,
          p_location: n.location_id,
          p_segment: sql,
          p_gap_days: gap,
        })
      : { data: [], error: null };
    if (error) throw error;
    const rows = (data ?? []) as unknown as AudienceRow[];

    const text = (r: AudienceRow) => {
      const vars: Partial<Record<Variable, string | number>> = {
        nombre: firstName(r.name),
        local: location.name,
        sellos: r.balance,
        faltan: Math.max(0, (r.stamps_required ?? 0) - r.balance),
        premio: r.reward_name ?? "",
      };
      return {
        title: renderNotification(n.title, vars).slice(0, 40),
        body: renderNotification(n.body, vars).slice(0, 160),
      };
    };
    const base = { notification_id: n.id, organization_id: n.organization_id };
    const insert = async (channel: string, list: AudienceRow[]) => {
      for (const part of chunk(list, 500)) {
        await db.from("notification_deliveries").upsert(
          part.map((r) => ({ ...base, customer_id: r.customer_id, channel, ...text(r) })),
          { onConflict: "notification_id,customer_id,channel", ignoreDuplicates: true },
        );
      }
    };

    // 1. Aviso dentro de la tarjeta: llega a todos los del segmento
    await insert("in_app", rows);

    let walletSent = 0;
    let pushSent = 0;
    let failed = 0;

    // 2. Apple Wallet: el pase se regenera con el aviso y se avisa al dispositivo
    if (appleConfig()) {
      const list = rows.filter((r) => r.has_apple);
      await insert("apple_wallet", list);
      await mapLimit(list, 8, (r) => pushApplePassUpdate(r.customer_id, n.location_id));
      walletSent += list.length;
    }

    // 3. Google Wallet
    if (googleConfig()) {
      const list = rows.filter((r) => r.has_google);
      await mapLimit(list, 8, async (r) => {
        const t = text(r);
        const ok = await sendGoogleMessage(passSerial(n.location_id, r.customer_id), t.title, t.body);
        await db
          .from("notification_deliveries")
          .upsert(
            { ...base, customer_id: r.customer_id, channel: "google_wallet", ...t, status: ok ? "sent" : "failed" },
            { onConflict: "notification_id,customer_id,channel" },
          );
        if (ok) walletSent += 1;
        else failed += 1;
      });
    }

    // 4. Web Push
    const push = pushConfig();
    if (push) {
      webpush.setVapidDetails(push.subject, push.publicKey, push.privateKey);
      const list = rows.filter((r) => r.has_push);
      await mapLimit(list, 8, async (r) => {
        const t = text(r);
        const { data: subs } = await db
          .from("push_subscriptions")
          .select("id, endpoint, p256dh, auth")
          .eq("customer_id", r.customer_id);
        let ok = false;
        for (const s of subs ?? []) {
          try {
            await webpush.sendNotification(
              { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
              JSON.stringify({ ...t, url: `/c/${location.slug}` }),
              { TTL: 86_400 },
            );
            ok = true;
          } catch (e) {
            const code = (e as { statusCode?: number }).statusCode;
            if (code === 404 || code === 410) await db.from("push_subscriptions").delete().eq("id", s.id);
          }
        }
        await db
          .from("notification_deliveries")
          .upsert(
            { ...base, customer_id: r.customer_id, channel: "web_push", ...t, status: ok ? "sent" : "failed" },
            { onConflict: "notification_id,customer_id,channel" },
          );
        if (ok) pushSent += 1;
        else failed += 1;
      });
    }

    await db
      .from("notifications")
      .update({
        status: "sent",
        sent_at: new Date().toISOString(),
        recipients: rows.length,
        wallet_sent: walletSent,
        push_sent: pushSent,
        failed,
      })
      .eq("id", n.id);
  } catch (e) {
    console.error("[notifications] fallo al repartir", n.id, e);
    await db.from("notifications").update({ status: "failed", sent_at: new Date().toISOString() }).eq("id", n.id);
  }
}
