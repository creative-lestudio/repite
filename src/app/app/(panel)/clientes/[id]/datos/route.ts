import { NextResponse } from "next/server";
import { getOwnerContext } from "@/server/auth/owner";
import { exportCustomerData } from "@/server/repositories/owner";

export const dynamic = "force-dynamic";

// Datos de un cliente para entregárselos (derecho de acceso y portabilidad). Solo dueño y responsables.
export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getOwnerContext();
  if (!ctx || ctx.role === "staff") return new NextResponse("No autorizado", { status: 403 });
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) return new NextResponse("No encontrado", { status: 404 });
  try {
    const data = await exportCustomerData(id);
    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="datos-cliente-${id.slice(0, 8)}.json"`,
        "Cache-Control": "no-store",
      },
    });
  } catch {
    return new NextResponse("No encontrado", { status: 404 });
  }
}
