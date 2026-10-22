import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { pushApplePassUpdate } from "./apple";
import { appleConfig, googleConfig } from "./config";
import { loadPassContent } from "./content";
import { updateGoogleObject } from "./google";

/** Pone al día las tarjetas de Wallet de un cliente. Nunca lanza: un fallo aquí no debe romper el registro de la visita. */
export async function refreshWalletPass(customerId: string, locationId: string): Promise<void> {
  try {
    const [apple, google] = [appleConfig(), googleConfig()];
    if (!apple && !google) return;
    await Promise.allSettled([
      apple ? pushApplePassUpdate(customerId, locationId) : null,
      google
        ? loadPassContent(customerId, locationId).then((c) => (c ? updateGoogleObject(c, locationId) : undefined))
        : null,
    ]);
  } catch {
    /* mejor esfuerzo */
  }
}

export async function refreshWalletForEvent(eventId: string, locationId: string): Promise<void> {
  const { data } = await createServiceClient()
    .from("stamp_events")
    .select("customer_id")
    .eq("id", eventId)
    .maybeSingle();
  if (data) await refreshWalletPass(data.customer_id, locationId);
}

export async function refreshWalletForReward(rewardId: string, locationId: string): Promise<void> {
  const { data } = await createServiceClient().from("rewards").select("customer_id").eq("id", rewardId).maybeSingle();
  if (data) await refreshWalletPass(data.customer_id, locationId);
}
