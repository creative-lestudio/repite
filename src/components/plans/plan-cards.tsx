"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { breakEvenVisits, MATRIX, PLAN_ORDER, PLANS, type Cell, type PlanId } from "@/config/plan";
import { cn } from "@/lib/utils";
import { CellValue } from "./cell";

// Funciones que se destacan en cada tarjeta (el resto está en la comparativa completa)
const HIGHLIGHTS: Record<PlanId, string[]> = {
  starter: ["customers", "staff", "devices", "nameColor", "qr", "csv"],
  basic: ["customers", "staff", "devices", "logo", "icon", "noBadge", "wallet", "bonuses"],
  plus: ["customers", "staff", "devices", "font", "shapes", "cardStyles", "customCard", "opportunities"],
};
const INHERITS: Partial<Record<PlanId, PlanId>> = { basic: "starter", plus: "basic" };
const ROWS = Object.fromEntries(MATRIX.flatMap((g) => g.rows.map((r) => [r.key, r])));

function money(currency: "EUR" | "USD", amount: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);
}

export function PlanCards({
  currency,
  ticket,
  current,
  renderCta,
}: {
  currency: "EUR" | "USD";
  /** Ticket medio para explicar cuántas visitas extra pagan el plan. */
  ticket: number;
  current?: string;
  renderCta: (plan: PlanId) => React.ReactNode;
}) {
  const t = useTranslations("plans");
  return (
    <div className="grid gap-4 lg:grid-cols-3">
      {PLAN_ORDER.map((p) => {
        const price = PLANS[p].price[currency];
        const popular = p === "basic";
        const parent = INHERITS[p];
        return (
          <div
            key={p}
            className={cn(
              "bg-surface shadow-card ring-cream-200 relative flex flex-col gap-4 rounded-xl p-6 ring-1",
              popular && "ring-primary ring-2",
              current === p && "bg-primary-soft/40",
            )}
          >
            {popular && (
              <span className="bg-primary absolute -top-3 left-6 rounded-full px-3 py-1 text-xs font-bold text-white">
                {t("popular")}
              </span>
            )}
            <div>
              <h3 className="font-display text-2xl font-extrabold">{t(`names.${p}`)}</h3>
              <p className="text-muted text-sm">{t(`taglines.${p}`)}</p>
            </div>
            <p className="font-display text-4xl font-extrabold">
              {price === 0 ? t("free") : money(currency, price)}{" "}
              <span className="text-muted text-base font-semibold">{price === 0 ? t("forever") : t("perMonth")}</span>
            </p>
            <p className="text-sm">{t(`pitch.${p}`)}</p>
            <ul className="flex flex-1 flex-col gap-2 text-sm">
              {parent && <li className="font-semibold">{t("includes", { plan: t(`names.${parent}`) })}</li>}
              {HIGHLIGHTS[p].map((k) => {
                const row = ROWS[k]!;
                const value = row[p] as Cell;
                const text = typeof value === "boolean";
                return (
                  <li key={k} className="flex items-start gap-2">
                    <Check className="text-success mt-0.5 size-4 shrink-0" aria-hidden />
                    <span>
                      {t(`features.${k}` as never)}
                      {!text && (
                        <>
                          : <CellValue value={value} className="font-semibold" />
                        </>
                      )}
                      {row.soon && (
                        <span className="bg-cream-100 text-wine-800 ml-2 rounded-full px-2 py-0.5 text-xs font-semibold whitespace-nowrap">
                          {t("soon")}
                        </span>
                      )}
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="bg-cream-50 text-muted rounded-lg p-3 text-xs">
              {p === "starter"
                ? t("why.starter")
                : t(
                    `why.${p}` as never,
                    {
                      visits: breakEvenVisits(p, currency, ticket),
                      ticket: money(currency, ticket),
                    } as never,
                  )}
            </p>
            {renderCta(p)}
          </div>
        );
      })}
    </div>
  );
}
