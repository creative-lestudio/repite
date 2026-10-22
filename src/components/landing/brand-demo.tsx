"use client";

import { useState, type CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { STAMP_ICON_COMPONENTS } from "@/components/sector-icon";
import { StampCard } from "@/components/stamp-card/stamp-card";
import {
  CARD_STYLES,
  DEFAULT_BRAND,
  FONT_KEYS,
  FONTS,
  STAMP_ICONS,
  STAMP_SHAPES,
  themeVars,
  type Brand,
} from "@/domain/brand";
import { cn } from "@/lib/utils";

const COLORS = ["#FF3B2E", "#7A0D12", "#F28C28", "#2E8B57", "#1F6FEB", "#7B3FE4", "#E8478B", "#111111"];
const ICONS = STAMP_ICONS.slice(0, 8);
const FONT_DEMO = FONT_KEYS.filter((k) => ["jakarta", "playfair", "poppins", "dmserif"].includes(k));

/** Probador de marca: la persona ve su tarjeta con su color, icono y estilo antes de registrarse. */
export function BrandDemo() {
  const t = useTranslations("landing.brandDemo");
  const ti = useTranslations("owner.brand");
  const [name, setName] = useState("");
  const [brand, setBrand] = useState<Brand>({ ...DEFAULT_BRAND, stampIcon: "coffee" });
  const set = <K extends keyof Brand>(k: K, v: Brand[K]) => setBrand((b) => ({ ...b, [k]: v }));
  const shownName = name.trim() || t("placeholder");

  const chip = (active: boolean) =>
    cn(
      "ring-cream-200 hover:bg-cream-50 min-h-11 rounded-lg px-3 text-sm font-semibold ring-1",
      active && "bg-primary-soft ring-primary ring-2",
    );
  const tag = (plan: "Starter" | "Basic" | "Plus") => (
    <span className="bg-cream-100 text-wine-800 ml-2 rounded-full px-2 py-0.5 text-xs font-semibold">{plan}</span>
  );

  return (
    <section id="marca" aria-labelledby="brand-demo-title" className="scroll-mt-16 bg-white px-4 py-20 md:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-2">
        <div>
          <h2 id="brand-demo-title" className="text-3xl font-extrabold md:text-5xl">
            {t("title")}
          </h2>
          <p className="text-muted mt-3 text-lg">{t("subtitle")}</p>

          <div className="mt-6 flex flex-col gap-5">
            <label className="flex flex-col gap-1 text-sm font-semibold">
              {t("nameLabel")} {tag("Starter")}
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={30}
                placeholder={t("placeholder")}
                className="border-input bg-surface min-h-12 rounded-lg border px-4 text-base font-normal"
              />
            </label>

            <div>
              <p className="mb-2 text-sm font-semibold">
                {t("color")} {tag("Starter")}
              </p>
              <div className="flex flex-wrap gap-2" role="group" aria-label={t("color")}>
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={c}
                    aria-pressed={brand.primary === c}
                    onClick={() => set("primary", c)}
                    style={{ background: c }}
                    className={cn(
                      "ring-cream-200 size-11 rounded-full ring-1",
                      brand.primary === c && "ring-ink-950 ring-offset-surface ring-2 ring-offset-2",
                    )}
                  />
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold">
                {t("icon")} {tag("Basic")}
              </p>
              <div className="flex flex-wrap gap-2" role="group" aria-label={t("icon")}>
                {ICONS.map((k) => {
                  const Icon = STAMP_ICON_COMPONENTS[k];
                  return (
                    <button
                      key={k}
                      type="button"
                      aria-pressed={brand.stampIcon === k}
                      onClick={() => set("stampIcon", k)}
                      className={cn(chip(brand.stampIcon === k), "flex w-11 items-center justify-center px-0")}
                    >
                      <Icon className="size-5" aria-hidden />
                      <span className="sr-only">{ti(`icons.${k}`)}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold">
                {t("shape")} {tag("Plus")}
              </p>
              <div className="flex flex-wrap gap-2" role="group" aria-label={t("shape")}>
                {STAMP_SHAPES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={brand.stampShape === s}
                    onClick={() => set("stampShape", s)}
                    className={chip(brand.stampShape === s)}
                  >
                    {ti(`shapes.${s}`)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold">
                {t("style")} {tag("Plus")}
              </p>
              <div className="flex flex-wrap gap-2" role="group" aria-label={t("style")}>
                {CARD_STYLES.map((s) => (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={brand.cardStyle === s}
                    onClick={() => set("cardStyle", s)}
                    className={chip(brand.cardStyle === s)}
                  >
                    {ti(`cardStyles.${s}`)}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-2 text-sm font-semibold">
                {t("font")} {tag("Plus")}
              </p>
              <div className="flex flex-wrap gap-2" role="group" aria-label={t("font")}>
                {FONT_DEMO.map((k) => (
                  <button
                    key={k}
                    type="button"
                    aria-pressed={brand.font === k}
                    onClick={() => set("font", k)}
                    style={{ fontFamily: FONTS[k].stack }}
                    className={chip(brand.font === k)}
                  >
                    {FONTS[k].label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div
          style={{ ...(themeVars(brand) as CSSProperties), fontFamily: "var(--font-sans)" }}
          className="bg-background ring-cream-200 mx-auto flex w-full max-w-sm flex-col gap-4 rounded-3xl p-5 shadow-xl ring-1"
        >
          <div className="flex items-center gap-3">
            <span className="bg-brand text-on-brand font-display flex size-10 items-center justify-center rounded-full text-lg font-extrabold">
              {shownName.charAt(0).toUpperCase()}
            </span>
            <p className="font-display text-lg font-bold">{shownName}</p>
          </div>
          <StampCard
            total={8}
            filled={5}
            rewardName={t("reward")}
            tone={brand.cardStyle}
            brand={{ stampShape: brand.stampShape, stampIcon: brand.stampIcon }}
          />
          <p className="text-muted text-center text-xs">{t("note")}</p>
        </div>
      </div>
    </section>
  );
}
