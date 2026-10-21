import "server-only";
import { createServiceClient } from "@/lib/supabase/server";

export type TemplateType = "birthday" | "inactive" | "near_reward" | "reward_ready" | "magic_link";

/** Plantilla del local si existe; si no, la global de Repite. */
export async function getTemplate(organizationId: string, type: TemplateType, locale: string): Promise<string> {
  const { data, error } = await createServiceClient()
    .from("message_templates")
    .select("organization_id, body")
    .eq("type", type)
    .eq("locale", locale)
    .is("deleted_at", null)
    .or(`organization_id.eq.${organizationId},organization_id.is.null`);
  if (error) throw error;
  const own = data?.find((t) => t.organization_id === organizationId);
  const global = data?.find((t) => t.organization_id === null);
  return (own ?? global)?.body ?? "";
}
