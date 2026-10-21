import { NextResponse, type NextRequest } from "next/server";
import { consumeMagicLink, startCustomerSession } from "@/server/auth/customer-session";
import { rateLimit } from "@/server/rate-limit";
import { getLocationBySlug } from "@/server/repositories/locations";

// Enlace mágico recibido por WhatsApp: abre la tarjeta en este dispositivo.
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const token = request.nextUrl.searchParams.get("t") ?? "";
  const location = await getLocationBySlug(slug);
  if (!location) return NextResponse.redirect(new URL(`/c/${slug}`, request.url));
  if (!(await rateLimit("magic-consume", 600, 20)) || token.length < 20) {
    return NextResponse.redirect(new URL(`/c/${slug}/recuperar?error=enlace`, request.url));
  }
  const customerId = await consumeMagicLink(location.organizationId, token);
  if (!customerId) return NextResponse.redirect(new URL(`/c/${slug}/recuperar?error=enlace`, request.url));
  await startCustomerSession(location.organizationId, customerId);
  return NextResponse.redirect(new URL(`/c/${slug}`, request.url));
}
