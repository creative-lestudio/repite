import "server-only";
import { createServiceClient } from "@/lib/supabase/server";

/** Último aviso del local que el cliente aún puede ver en su tarjeta (los de los últimos 7 días). */
export async function getLatestNotice(customerId: string): Promise<{ id: string; title: string; body: string } | null> {
  const { data } = await createServiceClient()
    .from("notification_deliveries")
    .select("id, title, body")
    .eq("customer_id", customerId)
    .eq("channel", "in_app")
    .gte("created_at", new Date(Date.now() - 7 * 86_400_000).toISOString())
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export async function savePushSubscription(
  organizationId: string,
  customerId: string,
  sub: { endpoint: string; p256dh: string; auth: string },
) {
  await createServiceClient()
    .from("push_subscriptions")
    .upsert(
      { organization_id: organizationId, customer_id: customerId, ...sub, last_seen_at: new Date().toISOString() },
      { onConflict: "endpoint" },
    );
}

export async function deletePushSubscription(customerId: string, endpoint: string) {
  await createServiceClient()
    .from("push_subscriptions")
    .delete()
    .eq("customer_id", customerId)
    .eq("endpoint", endpoint);
}

export async function hasPushSubscription(customerId: string): Promise<boolean> {
  const { count } = await createServiceClient()
    .from("push_subscriptions")
    .select("id", { count: "exact", head: true })
    .eq("customer_id", customerId);
  return (count ?? 0) > 0;
}
