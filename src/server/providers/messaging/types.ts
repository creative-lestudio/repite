export interface OutgoingMessage {
  to: string; // E.164
  body: string;
  kind: "marketing" | "transactional";
  /** Para WhatsApp: nombre de la plantilla aprobada fuera de la ventana de 24 h (fase 2). */
  templateName?: string;
  locale: string;
}

export type SendResult =
  | { ok: true; providerMessageId: string; status: "sent" | "delivered" }
  | { ok: false; error: string; retryable: boolean };

export interface MessagingProvider {
  readonly name: string;
  send(message: OutgoingMessage): Promise<SendResult>;
}
