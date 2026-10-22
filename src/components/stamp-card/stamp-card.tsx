"use client";

import { Gift } from "lucide-react";
import { useTranslations } from "next-intl";
import { SectorIcon } from "@/components/sector-icon";
import type { StampMode, StampShape } from "@/domain/brand";
import { cn } from "@/lib/utils";

/** Personalización de la tarjeta de un local (ver domain/brand.ts). */
export interface StampCardBrand {
  stampShape?: StampShape;
  stampMode?: StampMode;
  /** URL pública de la imagen del sello propio. */
  stampImageUrl?: string | null;
  /** URL pública del diseño de fondo de la tarjeta. */
  cardBgUrl?: string | null;
}

export interface StampCardProps {
  total: number;
  filled: number;
  /** Índice (1-based) del sello recién estampado, para animarlo una sola vez. */
  newStamp?: number | null;
  rewardName?: string;
  locationName?: string;
  /** Tipo de negocio: decide el icono del sello. */
  sector?: string | null;
  /** «dark»: tarjeta negra; «brand»: tarjeta del color de la marca del local. */
  tone?: "light" | "dark" | "brand";
  brand?: StampCardBrand;
  className?: string;
}

function columnsFor(total: number) {
  if (total <= 6) return 3;
  if (total % 5 === 0) return 5;
  return 4;
}

const CLIP: Partial<Record<StampShape, string>> = {
  hex: "polygon(25% 3%, 75% 3%, 100% 50%, 75% 97%, 25% 97%, 0% 50%)",
  star: "polygon(50% 2%, 61% 36%, 98% 36%, 68% 57%, 79% 92%, 50% 71%, 21% 92%, 32% 57%, 2% 36%, 39% 36%)",
};
const ROUND: Record<StampShape, string> = {
  circle: "rounded-full",
  square: "rounded-xl",
  hex: "",
  star: "",
};

/** Elemento memorable de Repite: cada sello se "estampa" con una animación breve. */
export function StampCard({
  total,
  filled,
  newStamp,
  rewardName,
  locationName,
  sector,
  tone = "light",
  brand,
  className,
}: StampCardProps) {
  const t = useTranslations();
  const safeFilled = Math.max(0, Math.min(filled, total));
  const left = total - safeFilled;
  const cols = columnsFor(total);
  const shape = brand?.stampShape ?? "circle";
  const mode = brand?.stampMode ?? "icon";
  const bg = brand?.cardBgUrl ?? null;
  // Con una imagen de fondo siempre se lee mejor texto claro sobre una capa oscura
  const effective = bg ? "image" : tone;
  const onColor = effective === "dark" || effective === "image" || effective === "brand";
  const clipped = Boolean(CLIP[shape]);

  const muted = effective === "brand" ? "text-on-brand/80" : onColor ? "text-stone-400" : "text-muted";
  const strong = effective === "brand" ? "text-on-brand" : onColor ? "text-cream-50" : "text-foreground";

  return (
    <section
      aria-label={t("stampCard.label", { count: safeFilled, total })}
      className={cn(
        "relative isolate overflow-hidden rounded-xl p-5",
        effective === "light" && "bg-surface shadow-card ring-cream-100 ring-1",
        effective === "dark" && "bg-ink-900 text-cream-50 ring-1 ring-white/10",
        effective === "brand" && "bg-brand text-on-brand shadow-card",
        effective === "image" && "bg-ink-900 text-cream-50 shadow-card",
        effective !== "brand" &&
          "before:bg-brand before:absolute before:inset-x-0 before:top-0 before:z-10 before:h-1.5",
        className,
      )}
    >
      {bg && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={bg} alt="" className="absolute inset-0 -z-20 size-full object-cover" />
          <div aria-hidden className="absolute inset-0 -z-10 bg-black/45" />
        </>
      )}
      <header className="mb-5 flex flex-wrap items-end justify-between gap-x-3 gap-y-2">
        <div>
          {locationName && <p className={cn("text-sm font-medium", muted)}>{locationName}</p>}
          <p className={cn("font-display text-2xl font-extrabold whitespace-nowrap", strong)}>
            {t("common.stampsOf", { count: safeFilled, total })}
          </p>
        </div>
        <span
          className={cn(
            "rounded-full px-3 py-1 text-sm font-semibold whitespace-nowrap",
            effective === "light" ? "bg-primary-soft text-ink-950" : "bg-white/15 text-white",
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
          const filledBg = effective === "brand" ? "bg-on-brand text-brand" : "bg-brand text-on-brand";
          const emptyBg = clipped
            ? effective === "light"
              ? "bg-cream-100 text-stone-400"
              : "bg-white/15 text-white/60"
            : effective === "light"
              ? "border-cream-200 border-2 border-dashed text-stone-400"
              : "border-2 border-dashed border-white/40 text-white/60";
          return (
            <li key={n} className="flex items-center justify-center">
              <span
                aria-label={isFilled ? t("stampCard.stampFilled", { n }) : t("stampCard.stamp", { n })}
                style={clipped ? { clipPath: CLIP[shape] } : undefined}
                className={cn(
                  "flex aspect-square w-full max-w-16 items-center justify-center overflow-hidden text-sm font-semibold",
                  ROUND[shape],
                  isFilled ? cn(filledBg, "-rotate-6") : emptyBg,
                  isFilled && !clipped && "shadow-[inset_0_-3px_0_rgb(0_0_0/0.18)]",
                  isNew && "animate-stamp",
                )}
              >
                {isFilled ? (
                  mode === "image" && brand?.stampImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={brand.stampImageUrl} alt="" className="size-full object-cover" />
                  ) : mode === "number" ? (
                    <span aria-hidden className="text-base">
                      {n}
                    </span>
                  ) : (
                    <SectorIcon sector={sector} className="size-1/2" aria-hidden strokeWidth={2.25} />
                  )
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
        <footer
          className={cn(
            "mt-5 flex items-center gap-3 rounded-lg p-3",
            effective === "light" ? "bg-cream-50" : "bg-white/10",
          )}
        >
          <Gift
            className={cn("size-5 shrink-0", effective === "light" ? "text-primary" : "text-current")}
            aria-hidden
          />
          <p className="text-sm">
            <span className={muted}>{t("stampCard.nextReward")}: </span>
            <span className={cn("font-semibold", strong)}>{rewardName}</span>
          </p>
        </footer>
      )}

      <p aria-live="polite" className="sr-only">
        {newStamp ? t("stampCard.newStamp") : ""}
      </p>
    </section>
  );
}
