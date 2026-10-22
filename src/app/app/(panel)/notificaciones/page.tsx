import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { NotificationComposer } from "@/components/owner/notification-composer";
import { Alert, Badge, Card } from "@/components/ui";
import { parseLevels } from "@/domain/levels";
import { BUILTIN_TEMPLATES, monthStartISO } from "@/domain/notifications";
import { planSpec } from "@/domain/plan";
import { requireManager } from "@/server/auth/owner";
import { pushConfig } from "@/server/notifications/config";
import {
  countNotificationsSince,
  getProgram,
  listNotifications,
  listNotificationTemplates,
} from "@/server/repositories/owner";
import { appleConfig, googleConfig } from "@/server/wallet/config";

export const metadata = { title: "Notificaciones" };

export default async function NotificationsPage() {
  const ctx = await requireManager();
  const t = await getTranslations("owner.notifications");
  const spec = planSpec(ctx.organization.effectivePlan);

  if (spec.notifications === 0) {
    return (
      <div className="flex max-w-3xl flex-col gap-6">
        <h1 className="text-3xl font-extrabold">{t("pageTitle")}</h1>
        <Card className="flex flex-col items-start gap-3">
          <p className="font-bold">{t("lockedTitle")}</p>
          <p className="text-muted">{t("lockedBody")}</p>
          <Link href="/app/plan" className="text-primary font-semibold underline underline-offset-4">
            {t("seePlans")}
          </Link>
        </Card>
      </div>
    );
  }

  const [history, templates, program, used] = await Promise.all([
    listNotifications(),
    listNotificationTemplates(),
    getProgram(),
    countNotificationsSince(monthStartISO(new Date(), ctx.location.timezone)),
  ]);
  const remaining = spec.notifications === null ? null : Math.max(0, spec.notifications - used);
  const fmt = new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: ctx.location.timezone,
  });

  return (
    <div className="flex max-w-5xl flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold">{t("pageTitle")}</h1>
        <p className="text-muted mt-1">{t("intro")}</p>
      </div>

      <NotificationComposer
        builtin={BUILTIN_TEMPLATES}
        custom={templates}
        levels={ctx.organization.effectivePlan === "starter" ? [] : parseLevels(program?.levels)}
        advanced={spec.advancedSegments}
        canSaveTemplates={spec.customTemplates}
        remaining={remaining}
        locationName={ctx.location.name}
        channels={{ apple: appleConfig() !== null, google: googleConfig() !== null, push: pushConfig() !== null }}
      />

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-bold">{t("historyTitle")}</h2>
        {history.length === 0 ? (
          <Alert tone="info">{t("historyEmpty")}</Alert>
        ) : (
          <ul className="flex flex-col gap-3">
            {history.map((n) => (
              <li key={n.id} className="bg-surface ring-cream-100 flex flex-col gap-1 rounded-xl p-4 ring-1">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="font-bold">{n.title}</p>
                  <Badge tone={n.status === "sent" ? "success" : n.status === "sending" ? "warning" : "danger"}>
                    {t(`status.${n.status}` as never)}
                  </Badge>
                </div>
                <p className="text-sm">{n.body}</p>
                <p className="text-muted text-xs">
                  {fmt.format(new Date(n.created_at))} · {t(`segments.${n.segment.type}` as never)} ·{" "}
                  {t("historyStats", { recipients: n.recipients, wallet: n.wallet_sent, push: n.push_sent })}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
