import { redirect } from "next/navigation";
import { requireStaff } from "@/server/auth/require-staff";
import { findCustomerByQrToken } from "@/server/repositories/staff";

// Destino del QR personal del cliente: abre su ficha si es de esta organización.
export default async function QrResolve({ params }: { params: Promise<{ token: string }> }) {
  const session = await requireStaff();
  const { token } = await params;
  const customerId = await findCustomerByQrToken(session.device.organizationId, token);
  redirect(customerId ? `/equipo/clientes/${customerId}` : "/equipo/escanear?error=notFound");
}
