/** Vista de la tarjeta a partir del saldo del libro. Pura y sin dependencias. */
export interface CardView {
  filled: number;
  total: number;
  left: number;
  nearReward: boolean;
}

export function cardView(balance: number, stampsRequired: number): CardView {
  const filled = Math.max(0, Math.min(balance, stampsRequired));
  const left = stampsRequired - filled;
  return { filled, total: stampsRequired, left, nearReward: left === 1 };
}
