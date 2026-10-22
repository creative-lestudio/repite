import { NextResponse, type NextRequest } from "next/server";
import { parseSerial } from "@/domain/wallet";
import { buildApplePass, isValidAppleAuth } from "@/server/wallet/apple";
import { appleConfig } from "@/server/wallet/config";
import { loadPassContent } from "@/server/wallet/content";

// Wallet descarga la versión más reciente de la tarjeta.
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ passTypeId: string; serial: string }> },
) {
  const { passTypeId, serial } = await params;
  const cfg = appleConfig();
  const ids = parseSerial(serial);
  if (!cfg || cfg.passTypeId !== passTypeId || !ids) return new NextResponse(null, { status: 404 });
  if (!isValidAppleAuth(request.headers.get("authorization"), serial)) return new NextResponse(null, { status: 401 });

  const content = await loadPassContent(ids.customerId, ids.locationId);
  if (!content) return new NextResponse(null, { status: 404 });
  const pass = await buildApplePass(content, cfg);
  return new NextResponse(new Uint8Array(pass), {
    headers: { "content-type": "application/vnd.apple.pkpass", "last-modified": new Date().toUTCString() },
  });
}
