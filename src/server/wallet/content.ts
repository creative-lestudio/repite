import "server-only";
import { env } from "@/lib/env";
import { passSerial, type PassContent } from "@/domain/wallet";
import { createServiceClient } from "@/lib/supabase/server";
import { firstName } from "@/domain/templates";
import { getCardState } from "../repositories/customers";

/** Reúne lo que muestra la tarjeta de Wallet de un cliente en un local. null si no hay programa activo. */
export async function loadPassContent(customerId: string, locationId: string): Promise<PassContent | null> {
  const db = createServiceClient();
  const [{ data: customer }, { data: location }] = await Promise.all([
    db.from("customers").select("name, qr_token, organization_id").eq("id", customerId).maybeSingle(),
    db.from("locations").select("name, brand_color, organization_id").eq("id", locationId).maybeSingle(),
  ]);
  if (!customer || !location || customer.organization_id !== location.organization_id) return null;
  const state = await getCardState(customerId, locationId);
  if (!state.program) return null;
  return {
    serial: passSerial(locationId, customerId),
    locationName: location.name,
    customerName: firstName(customer.name),
    rewardName: state.program.reward_name,
    total: state.program.stamps_required,
    filled: state.balance,
    rewardsReady: state.rewards.length,
    qrUrl: `${env().NEXT_PUBLIC_APP_URL}/equipo/q/${customer.qr_token}`,
    brandColor: /^#[0-9a-f]{6}$/i.test(location.brand_color ?? "") ? location.brand_color! : "#FF3B2E",
  };
}
