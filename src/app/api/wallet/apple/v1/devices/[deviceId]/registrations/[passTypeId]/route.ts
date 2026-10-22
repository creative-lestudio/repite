import { NextResponse, type NextRequest } from "next/server";
import { passSerial } from "@/domain/wallet";
import { createServiceClient } from "@/lib/supabase/server";
import { appleConfig } from "@/server/wallet/config";

// Wallet pregunta qué tarjetas de este dispositivo han cambiado desde la última vez.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ deviceId: string; passTypeId: string }> },
) {
  const { deviceId, passTypeId } = await params;
  if (appleConfig()?.passTypeId !== passTypeId) return new NextResponse(null, { status: 404 });

  const since = Number(request.nextUrl.searchParams.get("passesUpdatedSince") ?? 0);
  let query = createServiceClient()
    .from("wallet_registrations")
    .select("customer_id, location_id, updated_at")
    .eq("device_library_id", deviceId);
  if (since > 0) query = query.gt("updated_at", new Date(since).toISOString());
  const { data } = await query;
  if (!data?.length) return new NextResponse(null, { status: 204 });

  const lastUpdated = Math.max(...data.map((r) => new Date(r.updated_at).getTime()));
  return NextResponse.json({
    serialNumbers: data.map((r) => passSerial(r.location_id, r.customer_id)),
    lastUpdated: String(lastUpdated),
  });
}
