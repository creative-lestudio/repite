import { NextResponse } from "next/server";
import { planSpec } from "@/domain/plan";
import { getCustomerFromSession } from "@/server/auth/customer-session";
import { getLocationBySlug } from "@/server/repositories/locations";
import { googleConfig } from "@/server/wallet/config";
import { loadPassContent } from "@/server/wallet/content";
import { googleSaveUrl } from "@/server/wallet/google";

// «Añadir a Google Wallet»: redirige al enlace de guardado firmado.
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cfg = googleConfig();
  const location = await getLocationBySlug(slug);
  if (!cfg || !location || !planSpec(location.plan).wallet) return new NextResponse(null, { status: 404 });
  const customer = await getCustomerFromSession(location.organizationId);
  if (!customer) return NextResponse.redirect(new URL(`/c/${slug}`, req.url));

  const content = await loadPassContent(customer.id, location.id);
  if (!content) return new NextResponse(null, { status: 404 });
  return NextResponse.redirect(googleSaveUrl(content, location.id, cfg));
}
