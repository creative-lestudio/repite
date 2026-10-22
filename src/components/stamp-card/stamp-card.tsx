"use client";

import { Gift } from "lucide-react";
import { useTranslations } from "next-intl";
import { SectorIcon } from "@/components/sector-icon";
import { cn } from "@/lib/utils";

export interface StampCardProps {
  total: number;
  filled: number;
  /** Índice (1-based) del sello recién estampado, para animarlo una sola vez. */
  newStamp?: number | null;
  rewardName?: string;
  locationName?: string;
  /** Tipo de negocio: decide el icono del sello. */
  sector?: string | null;
  /** «dark»: tarjeta negra para fondos oscuros (portada y vistas de marketing). */
  tone?: "light" | "dark";
  className?: string;
}

function columnsFor(total: number) {
  if (total <= 6) return 3;
  if (total % 5 === 0) return 5;
  return 4;
}

/** Elemento memorable de Repite: cada sello se "estampa" con una animación breve. */
export function StampCard({
  total,
  filled,
  newStamp,
  rewardName,
  locationName,
  sector,
  tone = "light",
  className,
}: StampCardProps) {
  const t = useTranslations();
  const safeFilled = Math.max(0, Math.min(filled, total));
  const left = total - safeFilled;
  const cols = columnsFor(total);
  const dark = tone === "dark";

  return (
    <section
      aria-label={t("stampCard.label", { count: safeFilled, total })}
      className={cn(
        "relative overflow-hidden rounded-xl p-5",
        "before:bg-brand before:absolute before:inset-x-0 before:top-0 before:h-1.5",
        dark ? "bg-ink-900 text-cream-50 ring-1 ring-white/10" : "bg-surface shadow-card ring-cream-100 ring-1",
        className,
      )}
    >
      <header className="mb-5 flex flex-wrap items-end justify-between gap-x-3 gap-y-2">
        <div>
          {locationName && (
            <p className={cn("text-sm font-medium", dark ? "text-stone-400" : "text-muted")}>{locationName}</p>
          )}
          <p
            className={cn(
              "font-display text-2xl font-extrabold whitespace-nowrap",
              dark ? "text-cream-50" : "text-foreground",
            )}
          >
            {t("common.stampsOf", { count: safeFilled, total })}
          </p>
        </div>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-sm font-semibold whitespace-nowrap",
            dark ? "text-cream-100 bg-white/10" : "bg-primary-soft text-wine-800",
          )}
        >
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
                    ? "bg-brand -rotate-6 text-white shadow-[inset_0_-3px_0_rgb(0_0_0/0.18)]"
                    : dark
                      ? "border-2 border-dashed border-white/25 text-white/40"
                      : "border-cream-200 border-2 border-dashed text-stone-400",
                  isNew && "animate-stamp",
                  !isFilled &&
                    isLast &&
                    (dark
                      ? "border-solid border-red-500/70 text-red-500"
                      : "border-primary/40 text-primary border-solid"),
                )}
              >
                {isFilled ? (
                  <SectorIcon sector={sector} className="size-1/2" aria-hidden strokeWidth={2.25} />
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
        <footer className={cn("mt-5 flex items-center gap-3 rounded-lg p-3", dark ? "bg-white/5" : "bg-cream-50")}>
          <Gift className={cn("size-5 shrink-0", dark ? "text-red-500" : "text-primary")} aria-hidden />
          <p className="text-sm">
            <span className={dark ? "text-stone-400" : "text-muted"}>{t("stampCard.nextReward")}: </span>
            <span className={cn("font-semibold", dark ? "text-cream-50" : "text-foreground")}>{rewardName}</span>
          </p>
        </footer>
      )}

      <p aria-live="polite" className="sr-only">
        {newStamp ? t("stampCard.newStamp") : ""}
      </p>
    </section>
  );
}
