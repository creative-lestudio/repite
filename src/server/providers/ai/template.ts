import { BUSINESS_PRESETS } from "@/domain/business-types";
import { renderTemplate } from "@/domain/templates";
import type { AIProvider, DraftRequest, DraftResult } from "./types";

/** Redacta a partir de la plantilla del local. Es también el respaldo cuando la IA falla. */
export class TemplateAIProvider implements AIProvider {
  readonly name = "template";
  async draftMessage(req: DraftRequest): Promise<DraftResult> {
    return {
      aiGenerated: false,
      body: renderTemplate(req.fallbackTemplate, {
        nombre: req.customer.firstName,
        local: req.locationName,
        pedido: req.customer.usualOrder || BUSINESS_PRESETS[req.businessType ?? "otro"].fallbackWord[req.locale],
        premio: req.rewardName ?? "",
      }),
    };
  }
}
