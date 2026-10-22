import { NextResponse } from "next/server";
import { toCsv } from "@/domain/csv";
import { getOwnerContext } from "@/server/auth/owner";
import { exportCustomers } from "@/server/repositories/owner";
import { createUserClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Exportación CSV de todos los clientes. Solo dueño y responsables; queda registrada en la auditoría.
export async function GET() {
  const ctx = await getOwnerContext();
  if (!ctx || ctx.role === "staff") return new NextResponse("No autorizado", { status: 403 });
  const rows = await exportCustomers();
  const csv = toCsv(
    [
      "Nombre",
      "WhatsApp",
      "Cumpleaños (día-mes)",
      "Idioma",
      "Acepta mensajes",
      "Fecha del permiso",
      "Lo de siempre",
      "Cliente desde",
      "Última visita",
      "Visitas",
      "Sellos actuales",
      "Premios canjeados",
    ],
    rows.map((c) => [
      c.name,
      c.phone_e164,
      c.birthday ? c.birthday.slice(8, 10) + "-" + c.birthday.slice(5, 7) : "",
      c.locale,
      c.marketing_consent ? "sí" : "no",
      c.consent_at?.slice(0, 10),
      c.usual_order,
      c.created_at.slice(0, 10),
      c.last_visit_at?.slice(0, 10),
      c.visits,
      c.balance,
      c.redeemed,
    ]),
  );
  const supabase = await createUserClient();
  await supabase
    .from("audit_log")
    .insert({
      organization_id: ctx.organization.id,
      actor_type: "user",
      actor_id: ctx.userId,
      action: "customers.export",
      entity: "customer",
      data: { count: rows.length },
    })
    .then(
      () => {},
      () => {},
    );
  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="clientes-${ctx.location.slug}-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
