"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { breakEvenVisits, MATRIX, PLAN_ORDER, PLANS, type Cell, type PlanId } from "@/config/plan";
import { cn } from "@/lib/utils";
import { CellValue } from "./cell";

// Funciones que se destacan en cada tarjeta (el resto está en la comparativa completa)
const HIGHLIGHTS: Record<PlanId, string[]> = {
  starter: ["customers", "staff", "devices", "nameColor", "qr", "csv"],
  esencial: ["customers", "staff", "devices", "logo", "icon", "font", "customCard", "noBadge", "wallet", "bonuses"],
  growth: ["staff", "devices", "coupons", "levels", "notifications", "segments", "templates", "metrics", "proximity"],
};
const INHERITS: Partial<Record<PlanId, PlanId>> = { esencial: "starter", growth: "esencial" };
const ROWS = Object.fromEntries(MATRIX.flatMap((g) => g.rows.map((r) => [r.key, r])));

function money(amount: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(
    amount,
  );
}

export function PlanCards({
  ticket,
  current,
  renderCta,
  renderRedCta,
}: {
  /** Ticket medio para explicar cuántas visitas extra pagan el plan. */
  ticket: number;
  current?: string;
  renderCta: (plan: PlanId) => React.ReactNode;
  /** Botón de la tarjeta «Red» (solicitar información). */
  renderRedCta: () => React.ReactNode;
}) {
  const t = useTranslations("plans");
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {PLAN_ORDER.map((p) => {
        const price = PLANS[p].price;
        const parent = INHERITS[p];
        return (
          <div
            key={p}
            className={cn(
              "bg-surface shadow-card ring-cream-200 relative flex flex-col gap-4 rounded-xl p-6 ring-1",
              current === p && "bg-primary-soft/40",
            )}
          >
            <div>
              <h3 className="font-display text-2xl font-extrabold">{t(`names.${p}`)}</h3>
              <p className="text-muted text-sm">{t(`taglines.${p}`)}</p>
            </div>
            <p className="font-display text-4xl font-extrabold">
              {price === 0 ? t("free") : money(price)}{" "}
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
                      visits: breakEvenVisits(p, ticket),
                      ticket: money(ticket),
                    } as never,
                  )}
            </p>
            {renderCta(p)}
          </div>
        );
      })}
      <div className="bg-surface shadow-card ring-cream-200 flex flex-col gap-4 rounded-xl p-6 ring-1">
        <div>
          <h3 className="font-display text-2xl font-extrabold">{t("names.red")}</h3>
          <p className="text-muted text-sm">{t("taglines.red")}</p>
        </div>
        <p className="font-display text-4xl font-extrabold">{t("redPrice")}</p>
        <p className="flex-1 text-sm">{t("pitch.red")}</p>
        {renderRedCta()}
      </div>
    </div>
  );
}
