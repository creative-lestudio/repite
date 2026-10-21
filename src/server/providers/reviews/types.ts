/** Verificación de reseñas de Google Maps (fase 2). Stub: la validación es manual por el equipo. */
export interface ReviewsProvider {
  readonly name: string;
  verifyReview(input: {
    placeId: string;
    reviewerName: string;
    since: Date;
  }): Promise<"verified" | "not_found" | "unsupported">;
}

export class StubReviewsProvider implements ReviewsProvider {
  readonly name = "stub";
  async verifyReview() {
    return "unsupported" as const;
  }
}
