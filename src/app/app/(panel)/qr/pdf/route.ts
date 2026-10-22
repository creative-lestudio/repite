import { NextResponse, type NextRequest } from "next/server";
import { createUserClient } from "@/lib/supabase/server";
import { getOwnerContext } from "@/server/auth/owner";
import { buildMaterialPdf } from "@/server/pdf";
import { getProgram } from "@/server/repositories/owner";
import { appUrl } from "@/server/app-url";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const ctx = await getOwnerContext();
  if (!ctx) return new NextResponse("No autorizado", { status: 401 });
  const format = request.nextUrl.searchParams.get("formato") === "a6" ? "a6" : "a4";
  const program = await getProgram();
  const bytes = await buildMaterialPdf({
    url: `${await appUrl()}/c/${ctx.location.slug}`,
    locationName: ctx.location.name,
    rewardName: program?.reward_name ?? null,
    stamps: program?.stamps_required ?? null,
    brandColor: ctx.location.brandColor,
    format,
  });
  // Paso del asistente: «Descargar e imprimir tu QR»
  if (!ctx.organization.onboarding.qr && ctx.role === "owner") {
    const supabase = await createUserClient();
    await supabase
      .from("organizations")
      .update({ onboarding: { ...ctx.organization.onboarding, qr: true } })
      .eq("id", ctx.organization.id);
  }
  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="repite-${format === "a4" ? "cartel" : "mesa"}-${ctx.location.slug}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
