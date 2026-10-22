export type OpportunityType = "birthday" | "inactive" | "near_reward" | "reward_ready";

export interface DraftRequest {
  type: OpportunityType;
  locale: "es-ES" | "es-VE";
  locationName: string;
  businessType?: import("@/domain/business-types").BusinessType;
  tone?: string;
  customer: { firstName: string; usualOrder?: string | null; notes?: string[] };
  rewardName?: string;
  daysAway?: number;
  /** Plantilla de respaldo ya resuelta para este local e idioma. */
  fallbackTemplate: string;
}

export interface DraftResult {
  body: string;
  aiGenerated: boolean;
}

export interface AIProvider {
  readonly name: string;
  draftMessage(req: DraftRequest): Promise<DraftResult>;
}
