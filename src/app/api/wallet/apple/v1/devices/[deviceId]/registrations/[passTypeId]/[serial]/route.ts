import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { parseSerial } from "@/domain/wallet";
import { createServiceClient } from "@/lib/supabase/server";
import { isValidAppleAuth } from "@/server/wallet/apple";
import { appleConfig } from "@/server/wallet/config";

type Ctx = { params: Promise<{ deviceId: string; passTypeId: string; serial: string }> };

const body = z.object({ pushToken: z.string().min(1).max(500) });

async function authorize(request: NextRequest, { passTypeId, serial }: { passTypeId: string; serial: string }) {
  const cfg = appleConfig();
  const ids = parseSerial(serial);
  if (!cfg || cfg.passTypeId !== passTypeId || !ids) return null;
  return isValidAppleAuth(request.headers.get("authorization"), serial) ? ids : null;
}

// Wallet avisa de que un dispositivo guardó la tarjeta: lo anotamos para poder notificarle los cambios.
export async function POST(request: NextRequest, ctx: Ctx) {
  const p = await ctx.params;
  const ids = await authorize(request, p);
  if (!ids) return new NextResponse(null, { status: 401 });
  const parsed = body.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return new NextResponse(null, { status: 400 });

  const db = createServiceClient();
  const { data: customer } = await db
    .from("customers")
    .select("organization_id")
    .eq("id", ids.customerId)
    .maybeSingle();
  if (!customer) return new NextResponse(null, { status: 404 });
  const { error } = await db.from("wallet_registrations").upsert(
    {
      organization_id: customer.organization_id,
      customer_id: ids.customerId,
      location_id: ids.locationId,
      device_library_id: p.deviceId,
      push_token: parsed.data.pushToken,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "device_library_id,customer_id,location_id" },
  );
  return new NextResponse(null, { status: error ? 500 : 201 });
}

export async function DELETE(request: NextRequest, ctx: Ctx) {
  const p = await ctx.params;
  const ids = await authorize(request, p);
  if (!ids) return new NextResponse(null, { status: 401 });
  await createServiceClient()
    .from("wallet_registrations")
    .delete()
    .eq("device_library_id", p.deviceId)
    .eq("customer_id", ids.customerId)
    .eq("location_id", ids.locationId);
  return new NextResponse(null, { status: 200 });
}
