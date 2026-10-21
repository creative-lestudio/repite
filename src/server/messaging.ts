import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { getMessagingProvider } from "./providers";

/**
 * Envía un mensaje transaccional (p. ej. enlace de acceso) y deja constancia en messages.
 * Los mensajes de marketing NUNCA pasan por aquí: requieren aprobación del dueño (motor de oportunidades).
 */
export async function sendTransactional(input: {
  organizationId: string;
  locationId: string;
  customerId: string;
  to: string;
  body: string;
  locale: string;
}) {
  const provider = getMessagingProvider();
  const result = await provider.send({ to: input.to, body: input.body, kind: "transactional", locale: input.locale });
  await createServiceClient()
    .from("messages")
    .insert({
      organization_id: input.organizationId,
      location_id: input.locationId,
      customer_id: input.customerId,
      kind: "transactional",
      body: input.body,
      provider: provider.name,
      status: result.ok ? result.status : "failed",
      provider_message_id: result.ok ? result.providerMessageId : null,
      error: result.ok ? null : result.error,
      sent_at: result.ok ? new Date().toISOString() : null,
    });
  return result;
}
