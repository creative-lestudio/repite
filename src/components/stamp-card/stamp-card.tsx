"use client";

import { Coffee, Gift } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export interface StampCardProps {
  total: number;
  filled: number;
  /** Índice (1-based) del sello recién estampado, para animarlo una sola vez. */
  newStamp?: number | null;
  rewardName?: string;
  locationName?: string;
  className?: string;
}

function columnsFor(total: number) {
  if (total <= 6) return 3;
  if (total % 5 === 0) return 5;
  return 4;
}

/** Elemento memorable de Repite: cada sello se "estampa" con una animación breve. */
export function StampCard({ total, filled, newStamp, rewardName, locationName, className }: StampCardProps) {
  const t = useTranslations();
  const safeFilled = Math.max(0, Math.min(filled, total));
  const left = total - safeFilled;
  const cols = columnsFor(total);

  return (
    <section
      aria-label={t("stampCard.label", { count: safeFilled, total })}
      className={cn(
        "bg-surface shadow-card relative overflow-hidden rounded-xl p-5 ring-1 ring-blue-100",
        "before:bg-brand before:absolute before:inset-x-0 before:top-0 before:h-1.5",
        className,
      )}
    >
      <header className="mb-5 flex flex-wrap items-end justify-between gap-x-3 gap-y-2">
        <div>
          {locationName && <p className="text-muted text-sm font-medium">{locationName}</p>}
          <p className="font-display text-foreground text-2xl font-extrabold whitespace-nowrap">
            {t("common.stampsOf", { count: safeFilled, total })}
          </p>
        </div>
        <span className="bg-primary-soft rounded-full px-3 py-1 text-sm font-semibold whitespace-nowrap text-blue-800">
          {t("common.stampsLeft", { count: left })}
        </span>
      </header>

      <ol className="grid gap-3" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
        {Array.from({ length: total }, (_, i) => {
          const n = i + 1;
          const isFilled = n <= safeFilled;
          const isNew = isFilled && n === newStamp;
          const isLast = n === total;
          return (
            <li key={n} className="flex items-center justify-center">
              <span
                aria-label={isFilled ? t("stampCard.stampFilled", { n }) : t("stampCard.stamp", { n })}
                className={cn(
                  "flex aspect-square w-full max-w-16 items-center justify-center rounded-full text-sm font-semibold",
                  isFilled
                    ? "bg-brand -rotate-6 text-white shadow-[inset_0_-3px_0_rgb(0_0_0/0.15)]"
                    : "border-2 border-dashed border-blue-200 text-blue-200",
                  isNew && "animate-stamp",
                  !isFilled && isLast && "border-primary/40 text-primary border-solid",
                )}
              >
                {isFilled ? (
                  <Coffee className="size-1/2" aria-hidden strokeWidth={2.25} />
                ) : isLast ? (
                  <Gift className="size-1/2" aria-hidden />
                ) : (
                  <span aria-hidden>{n}</span>
                )}
              </span>
            </li>
          );
        })}
      </ol>

      {rewardName && (
        <footer className="mt-5 flex items-center gap-3 rounded-lg bg-blue-50 p-3">
          <Gift className="text-primary size-5 shrink-0" aria-hidden />
          <p className="text-sm">
            <span className="text-muted">{t("stampCard.nextReward")}: </span>
            <span className="text-foreground font-semibold">{rewardName}</span>
          </p>
        </footer>
      )}

      <p aria-live="polite" className="sr-only">
        {newStamp ? t("stampCard.newStamp") : ""}
      </p>
    </section>
  );
}
