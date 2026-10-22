import { NextResponse, type NextRequest } from "next/server";
import { pairDevice } from "@/server/auth/staff-session";
import { rateLimit } from "@/server/rate-limit";

// Vincula esta tablet al local: el dueño muestra un QR con /equipo/vincular?t=<token del dispositivo>.
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("t") ?? "";
  const ok = (await rateLimit("pair", 600, 20)) && token.length >= 16 && (await pairDevice(token));
  return NextResponse.redirect(new URL(ok ? "/equipo" : "/equipo?vinculacion=invalida", request.url));
}
