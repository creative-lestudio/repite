import "server-only";
import { currentLevel } from "@/domain/levels";
import { planSpec } from "@/domain/plan";
import { firstName } from "@/domain/templates";
import { passSerial, type PassContent } from "@/domain/wallet";
import { createServiceClient } from "@/lib/supabase/server";
import { appUrl } from "@/server/app-url";
import { brandAssets } from "../brand-assets";
import { getCardState } from "../repositories/customers";
import { getLocationById } from "../repositories/locations";

/** Reúne lo que muestra la tarjeta de Wallet de un cliente en un local. null si no hay programa activo. */
export async function loadPassContent(customerId: string, locationId: string): Promise<PassContent | null> {
  const [{ data: customer }, location] = await Promise.all([
    createServiceClient()
      .from("customers")
      .select("name, qr_token, organization_id")
      .eq("id", customerId)
      .maybeSingle(),
    getLocationById(locationId),
  ]);
  if (!customer || !location || customer.organization_id !== location.organizationId) return null;
  const state = await getCardState(customerId, locationId);
  if (!state.program) return null;
  const level = planSpec(location.plan).levels ? currentLevel(state.levels, state.visits_total) : null;
  return {
    serial: passSerial(locationId, customerId),
    locationName: location.name,
    customerName: firstName(customer.name),
    rewardName: state.program.reward_name,
    total: state.program.stamps_required,
    filled: state.balance,
    rewardsReady: state.rewards.length,
    qrUrl: `${await appUrl()}/equipo/q/${customer.qr_token}`,
    brandColor: location.brand.primary,
    logoUrl: brandAssets(location.brand).logoUrl,
    levelName: level?.name ?? null,
    couponsReady: state.coupons.length,
    couponTitle: state.coupons[0]?.title ?? null,
  };
}
