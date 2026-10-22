"use client";

import { MessageCircle, Stamp } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { SectorIcon } from "@/components/sector-icon";
import { StampCard } from "@/components/stamp-card/stamp-card";
import { BUSINESS_PRESETS, LANDING_SECTORS, type LandingSector } from "@/domain/business-types";
import { cn } from "@/lib/utils";

/** Móvil de ejemplo con selector de sector: la tarjeta cambia de icono, nombre y premio. */
export function HeroDemo({ initial = "cafeteria", locked = false }: { initial?: LandingSector; locked?: boolean }) {
  const t = useTranslations("landing.hero");
  const ts = useTranslations("sectors");
  const [sector, setSector] = useState<LandingSector>(initial);
  const [auto, setAuto] = useState(!locked);

  // Rota sola cada 4 s hasta que la persona elige; sin movimiento si lo prefiere así
  useEffect(() => {
    if (!auto || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      setSector((s) => LANDING_SECTORS[(LANDING_SECTORS.indexOf(s) + 1) % LANDING_SECTORS.length]);
    }, 4000);
    return () => clearInterval(id);
  }, [auto]);

  const total = BUSINESS_PRESETS[sector].stamps;

  return (
    <div className="flex flex-col items-center gap-8">
      {!locked && (
        <div
          role="tablist"
          aria-label={t("tabsLabel")}
          className="bg-surface shadow-card ring-cream-100 flex gap-1 rounded-full p-1 ring-1"
        >
          {LANDING_SECTORS.map((s) => (
            <button
              key={s}
              role="tab"
              aria-selected={sector === s}
              onClick={() => {
                setAuto(false);
                setSector(s);
              }}
              className={cn(
                "flex min-h-11 items-center gap-1.5 rounded-full px-3 text-sm font-semibold transition-colors sm:px-4",
                sector === s ? "bg-primary text-white" : "text-muted hover:text-wine-800",
              )}
            >
              <SectorIcon sector={s} className="size-4" aria-hidden />
              {ts(`${s}.plural`)}
            </button>
          ))}
        </div>
      )}

      <div className="relative mx-auto w-full max-w-[19rem] sm:max-w-[21rem]" role="img" aria-label={t("phoneLabel")}>
        <div aria-hidden className="bg-ink-950 ring-ink-950/10 rounded-[2.5rem] p-3 shadow-2xl ring-1">
          <div className="bg-ink-900 rounded-[2rem] px-4 pt-5 pb-6">
            <div className="mb-4 flex items-center gap-2">
              <span className="bg-brand font-display flex size-8 items-center justify-center rounded-full text-sm font-extrabold text-white">
                {ts(`${sector}.clientName`).charAt(0)}
              </span>
              <span className="font-display text-cream-50 font-bold">{ts(`${sector}.clientName`)}</span>
            </div>
            {/* key: al cambiar de sector la tarjeta se vuelve a montar y el sello se estampa otra vez */}
            <StampCard
              key={sector}
              total={total}
              filled={Math.floor(total / 2)}
              newStamp={Math.floor(total / 2)}
              rewardName={ts(`${sector}.rewardExample`)}
              sector={sector}
              tone="dark"
            />
          </div>
        </div>

        <div
          aria-hidden
          className="bg-surface shadow-card animate-fade-in ring-cream-100 absolute -top-3 -right-2 flex items-center gap-2 rounded-xl px-3 py-2 ring-1 sm:-right-10"
        >
          <span className="bg-primary flex size-8 items-center justify-center rounded-full text-white">
            <Stamp className="size-4" />
          </span>
          <span className="text-left leading-tight">
            <span className="block text-sm font-bold">{t("chipStamp")}</span>
            <span className="text-muted block text-xs">{t("chipStampBody")}</span>
          </span>
        </div>

        <div
          aria-hidden
          className="bg-surface shadow-card ring-cream-100 absolute -bottom-12 -left-2 flex max-w-[15rem] items-center gap-2 rounded-xl px-3 py-2 ring-1 sm:-left-12"
        >
          <span className="bg-success/10 text-success flex size-8 shrink-0 items-center justify-center rounded-full">
            <MessageCircle className="size-4" />
          </span>
          <span className="text-left leading-tight">
            <span className="block text-sm font-bold">{t("chipMessage")}</span>
            <span className="text-muted block text-xs">{t("chipMessageBody")}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
