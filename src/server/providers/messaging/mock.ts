import type { MessagingProvider, OutgoingMessage, SendResult } from "./types";

/** Simula WhatsApp: no envía nada, deja constancia en memoria y en consola. */
export class MockMessagingProvider implements MessagingProvider {
  readonly name = "mock";
  readonly outbox: OutgoingMessage[] = [];

  async send(message: OutgoingMessage): Promise<SendResult> {
    this.outbox.push(message);
    if (process.env.NODE_ENV !== "test") {
      console.info(`[mock-whatsapp] → ${message.to}: ${message.body}`);
    }
    // Número de prueba para simular un fallo de entrega
    if (message.to.endsWith("0000000"))
      return { ok: false, error: "Número no disponible en WhatsApp", retryable: false };
    return { ok: true, providerMessageId: `mock_${crypto.randomUUID()}`, status: "delivered" };
  }
}
