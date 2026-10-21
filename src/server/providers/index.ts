import "server-only";
import { env } from "@/lib/env";
import { TemplateAIProvider } from "./ai/template";
import type { AIProvider } from "./ai/types";
import { MockMessagingProvider } from "./messaging/mock";
import type { MessagingProvider } from "./messaging/types";
import { WhatsAppCloudProvider } from "./messaging/whatsapp";
import { StubPaymentsProvider, type PaymentsProvider } from "./payments/types";
import { StubReviewsProvider, type ReviewsProvider } from "./reviews/types";

let messaging: MessagingProvider | undefined;
export function getMessagingProvider(): MessagingProvider {
  if (messaging) return messaging;
  const e = env();
  if (e.MESSAGING_PROVIDER === "whatsapp") {
    if (!e.WHATSAPP_TOKEN || !e.WHATSAPP_PHONE_NUMBER_ID) {
      throw new Error("Faltan WHATSAPP_TOKEN o WHATSAPP_PHONE_NUMBER_ID");
    }
    messaging = new WhatsAppCloudProvider(e.WHATSAPP_TOKEN, e.WHATSAPP_PHONE_NUMBER_ID);
  } else {
    messaging = new MockMessagingProvider();
  }
  return messaging;
}

let ai: AIProvider | undefined;
export function getAIProvider(): AIProvider {
  // El proveedor de Claude se conecta en el corte del motor de oportunidades.
  ai ??= new TemplateAIProvider();
  return ai;
}

export const getPaymentsProvider = (): PaymentsProvider => new StubPaymentsProvider();
export const getReviewsProvider = (): ReviewsProvider => new StubReviewsProvider();
