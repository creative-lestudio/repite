import { NextResponse } from "next/server";
import { planSpec } from "@/domain/plan";
import { getCustomerFromSession } from "@/server/auth/customer-session";
import { getLocationBySlug } from "@/server/repositories/locations";
import { buildApplePass } from "@/server/wallet/apple";
import { appleConfig } from "@/server/wallet/config";
import { loadPassContent } from "@/server/wallet/content";

// «Añadir a Apple Wallet»: devuelve la tarjeta del cliente con sesión iniciada.
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const cfg = appleConfig();
  const location = await getLocationBySlug(slug);
  if (!cfg || !location || !planSpec(location.plan).wallet) return new NextResponse(null, { status: 404 });
  const customer = await getCustomerFromSession(location.organizationId);
  if (!customer) return NextResponse.redirect(new URL(`/c/${slug}`, _req.url));

  const content = await loadPassContent(customer.id, location.id);
  if (!content) return new NextResponse(null, { status: 404 });
  const pass = await buildApplePass(content, cfg);
  return new NextResponse(new Uint8Array(pass), {
    headers: {
      "content-type": "application/vnd.apple.pkpass",
      "content-disposition": `attachment; filename="${slug}.pkpass"`,
      "cache-control": "no-store",
    },
  });
}
