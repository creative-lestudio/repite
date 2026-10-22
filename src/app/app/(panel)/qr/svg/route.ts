import { NextResponse } from "next/server";
import { getOwnerContext } from "@/server/auth/owner";
import { qrSvg } from "@/server/qr";
import { appUrl } from "@/server/app-url";

export const dynamic = "force-dynamic";

export async function GET() {
  const ctx = await getOwnerContext();
  if (!ctx) return new NextResponse("No autorizado", { status: 401 });
  const svg = await qrSvg(`${await appUrl()}/c/${ctx.location.slug}`, { margin: 2 });
  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Content-Disposition": `attachment; filename="repite-qr-${ctx.location.slug}.svg"`,
      "Cache-Control": "no-store",
    },
  });
}
