"use server";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { z } from "zod";
import { parseLevels } from "@/domain/levels";
import {
  contentSchema,
  isSegmentAllowed,
  monthStartISO,
  segmentSchema,
  toSqlSegment,
  type Segment,
} from "@/domain/notifications";
import { hasRoom, planSpec } from "@/domain/plan";
import { createUserClient } from "@/lib/supabase/server";
import { requireManager } from "../auth/owner";
import { deliverNotification } from "../notifications/deliver";
import { rateLimit } from "../rate-limit";
import { getProgram } from "../repositories/owner";

type Fail = { ok: false; error: string; fields?: Record<string, string> };

export interface AudiencePreview {
  total: number;
  apple: number;
  google: number;
  push: number;
}

async function resolveSegment(raw: unknown, advanced: boolean): Promise<{ segment: Segment } | Fail> {
  const parsed = segmentSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "generic" };
  if (!isSegmentAllowed(parsed.data.type, advanced)) return { ok: false, error: "planRequired" };
  return { segment: parsed.data };
}

/** Cuántos clientes cumplen el segmento y por qué canales se les puede avisar. */
export async function previewAudienceAction(raw: unknown): Promise<({ ok: true } & AudiencePreview) | Fail> {
  const ctx = await requireManager();
  const spec = planSpec(ctx.organization.effectivePlan);
  if (spec.notifications === 0) return { ok: false, error: "planRequired" };
  const seg = await resolveSegment(raw, spec.advancedSegments);
  if ("ok" in seg) return seg;
  const program = await getProgram();
  const sql = toSqlSegment(seg.segment, parseLevels(program?.levels));
  if (!sql) return { ok: true, total: 0, apple: 0, google: 0, push: 0 };

  const { data, error } = await (
    await createUserClient()
  ).rpc("notification_audience", {
    p_org: ctx.organization.id,
    p_location: ctx.location.id,
    p_segment: sql,
    p_gap_days: Number(ctx.location.settings.message_min_days ?? 7),
  });
  if (error) throw error;
  const rows = data ?? [];
  return {
    ok: true,
    total: rows.length,
    apple: rows.filter((r) => r.has_apple).length,
    google: rows.filter((r) => r.has_google).length,
    push: rows.filter((r) => r.has_push).length,
  };
}

const sendSchema = z.object({ title: z.string(), body: z.string(), segment: z.unknown() });

/** Crea la notificación y la reparte en segundo plano. */
export async function sendNotificationAction(input: z.input<typeof sendSchema>): Promise<{ ok: true } | Fail> {
  const ctx = await requireManager();
  const spec = planSpec(ctx.organization.effectivePlan);
  if (spec.notifications === 0) return { ok: false, error: "planRequired" };
  if (!(await rateLimit("notify", 3600, 20, ctx.organization.id))) return { ok: false, error: "rateLimited" };

  const parsedInput = sendSchema.safeParse(input);
  const content = contentSchema.safeParse(parsedInput.success ? parsedInput.data : {});
  if (!content.success) {
    const fields: Record<string, string> = {};
    for (const i of content.error.issues) fields[String(i.path[0])] ??= i.message;
    return { ok: false, error: "form", fields };
  }
  const seg = await resolveSegment(parsedInput.success ? parsedInput.data.segment : null, spec.advancedSegments);
  if ("ok" in seg) return seg;

  const supabase = await createUserClient();
  const since = monthStartISO(new Date(), ctx.location.timezone);
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .gte("created_at", since)
    .in("status", ["sending", "sent"]);
  if (!hasRoom(count ?? 0, spec.notifications)) return { ok: false, error: "notificationsLimit" };

  const { data, error } = await supabase
    .from("notifications")
    .insert({
      organization_id: ctx.organization.id,
      location_id: ctx.location.id,
      title: content.data.title,
      body: content.data.body,
      segment: { type: seg.segment.type, value: seg.segment.value ?? null },
      created_by: ctx.userId,
    })
    .select("id")
    .single();
  if (error) throw error;

  after(() => deliverNotification(data.id));
  revalidatePath("/app/notificaciones");
  return { ok: true };
}

const templateSchema = z.object({ name: z.string().trim().min(2, "templateNameRequired").max(40) });

export async function saveTemplateAction(input: {
  name: string;
  title: string;
  body: string;
}): Promise<{ ok: true } | Fail> {
  const ctx = await requireManager();
  if (!planSpec(ctx.organization.effectivePlan).customTemplates) return { ok: false, error: "planRequired" };
  const name = templateSchema.safeParse({ name: input.name });
  const content = contentSchema.safeParse({ title: input.title, body: input.body });
  if (!name.success || !content.success) return { ok: false, error: "form", fields: { name: "templateNameRequired" } };
  const { error } = await (await createUserClient()).from("notification_templates").insert({
    organization_id: ctx.organization.id,
    name: name.data.name,
    title: content.data.title,
    body: content.data.body,
  });
  if (error) throw error;
  revalidatePath("/app/notificaciones");
  return { ok: true };
}

export async function deleteTemplateAction(id: string): Promise<{ ok: true } | Fail> {
  await requireManager();
  if (!z.string().uuid().safeParse(id).success) return { ok: false, error: "generic" };
  const { error } = await (
    await createUserClient()
  )
    .from("notification_templates")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
  revalidatePath("/app/notificaciones");
  return { ok: true };
}
