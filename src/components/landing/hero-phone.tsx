"use client";

import { MessageCircle, Stamp } from "lucide-react";
import { useTranslations } from "next-intl";
import { StampCard } from "@/components/stamp-card/stamp-card";

/** Móvil de ejemplo para la portada: la tarjeta real de Repite con el cuarto sello estampándose al cargar. */
export function HeroPhone() {
  const t = useTranslations("landing.hero");
  return (
    <div className="relative mx-auto w-full max-w-[19rem] sm:max-w-[21rem]" role="img" aria-label={t("phoneLabel")}>
      <div aria-hidden className="rounded-[2.5rem] bg-blue-950 p-3 shadow-2xl ring-1 ring-blue-950/10">
        <div className="rounded-[2rem] bg-blue-50 px-4 pt-5 pb-6">
          <div className="mb-4 flex items-center gap-2">
            <span className="bg-brand font-display flex size-8 items-center justify-center rounded-full text-sm font-extrabold text-white">
              C
            </span>
            <span className="font-display font-bold">Café Aurora</span>
          </div>
          <StampCard total={8} filled={4} newStamp={4} rewardName="Un café gratis" />
        </div>
      </div>

      <div
        aria-hidden
        className="bg-surface shadow-card animate-fade-in absolute -top-3 -right-2 flex items-center gap-2 rounded-xl px-3 py-2 ring-1 ring-blue-100 sm:-right-10"
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
        className="bg-surface shadow-card absolute -bottom-12 -left-2 flex max-w-[15rem] items-center gap-2 rounded-xl px-3 py-2 ring-1 ring-blue-100 sm:-left-12"
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
  );
}
