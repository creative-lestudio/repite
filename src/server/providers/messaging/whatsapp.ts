import type { MessagingProvider, OutgoingMessage, SendResult } from "./types";

/** WhatsApp Cloud API de Meta. Se activa en fase 2 con MESSAGING_PROVIDER=whatsapp. */
export class WhatsAppCloudProvider implements MessagingProvider {
  readonly name = "whatsapp";
  constructor(
    private readonly token: string,
    private readonly phoneNumberId: string,
    private readonly apiVersion = "v21.0",
  ) {}

  async send(message: OutgoingMessage): Promise<SendResult> {
    const res = await fetch(`https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${this.token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: message.to.replace(/^\+/, ""),
        type: "text",
        text: { body: message.body },
      }),
    });
    if (!res.ok) {
      const detail = await res.text();
      return { ok: false, error: `WhatsApp ${res.status}: ${detail.slice(0, 300)}`, retryable: res.status >= 500 };
    }
    const json = (await res.json()) as { messages?: { id: string }[] };
    return { ok: true, providerMessageId: json.messages?.[0]?.id ?? "unknown", status: "sent" };
  }
}
