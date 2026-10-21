/** Facturación (fase 2). Stub: la Fase 1 solo muestra el plan y la prueba de 30 días. */
export interface PaymentsProvider {
  readonly name: string;
  createCheckout(organizationId: string): Promise<{ url: string } | { error: string }>;
}

export class StubPaymentsProvider implements PaymentsProvider {
  readonly name = "stub";
  async createCheckout() {
    return { error: "La facturación todavía no está disponible." };
  }
}
