"use client";

import { ImagePlus, Lock, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type CSSProperties } from "react";
import { useTranslations } from "next-intl";
import { BrandLogo } from "@/components/brand-logo";
import { useToast } from "@/components/staff/toaster";
import { STAMP_ICON_COMPONENTS } from "@/components/sector-icon";
import { StampCard } from "@/components/stamp-card/stamp-card";
import { Button, Card } from "@/components/ui";
import {
  actionColor,
  CARD_STYLES,
  FONTS,
  FONT_KEYS,
  restrictBrand,
  STAMP_ICONS,
  STAMP_MODES,
  STAMP_SHAPES,
  themeVars,
  type Brand,
} from "@/domain/brand";
import { allowsCustomization, type EffectivePlan } from "@/domain/plan";
import { removeBrandImageAction, saveBrandAction, uploadBrandImageAction } from "@/server/actions/brand";
import { cn } from "@/lib/utils";

const PRESETS = ["#FF3B2E", "#7A0D12", "#F28C28", "#2E8B57", "#1F6FEB", "#7B3FE4", "#E8478B", "#111111"];

interface Props {
  initial: Brand;
  locationName: string;
  sector: string;
  logoUrl: string | null;
  stampImageUrl: string | null;
  cardBgUrl: string | null;
  plan: EffectivePlan;
}

/** Sección que el plan no incluye: se ve, se explica y no se puede tocar. */
function Locked({ locked, need, children }: { locked: boolean; need: "basic" | "plus"; children: React.ReactNode }) {
  const t = useTranslations("owner.plan");
  if (!locked) return <>{children}</>;
  return (
    <div className="flex flex-col gap-3">
      <p className="bg-cream-100 flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg px-3 py-2 text-sm font-semibold">
        <Lock className="size-4 shrink-0" aria-hidden />
        {t("locked", { plan: need })}
        <Link href="/app/plan" className="text-primary underline underline-offset-4">
          {t("upgradeLink")}
        </Link>
      </p>
      <fieldset disabled className="flex flex-col gap-4 opacity-50">
        {children}
      </fieldset>
    </div>
  );
}

function Choice({
  active,
  onClick,
  children,
  className,
  style,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      style={style}
      className={cn(
        "ring-cream-200 hover:bg-cream-50 min-h-11 rounded-lg px-3 py-2 text-left text-sm font-semibold ring-1 transition-colors",
        active && "bg-primary-soft ring-primary ring-2",
        className,
      )}
    >
      {children}
    </button>
  );
}

function ImageField({
  kind,
  url,
  label,
  hint,
  onDone,
}: {
  kind: "logo" | "stamp" | "card";
  url: string | null;
  label: string;
  hint: string;
  onDone: () => void;
}) {
  const t = useTranslations("owner.brand");
  const te = useTranslations("errors");
  const toast = useToast();
  const input = useRef<HTMLInputElement>(null);
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<{ ok: true } | { ok: false; error: string }>) =>
    start(async () => {
      const r = await fn();
      if (r.ok) onDone();
      else toast({ tone: "danger", text: te(r.error as never) });
    });

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="bg-cream-100 ring-cream-200 flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-lg ring-1">
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={url} alt="" className="size-full object-contain" />
        ) : (
          <ImagePlus className="text-stone-400" aria-hidden />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="text-muted text-sm">{hint}</p>
        <div className="flex flex-wrap gap-2">
          <input
            ref={input}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="sr-only"
            aria-label={label}
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              const fd = new FormData();
              fd.set("file", file);
              run(() => uploadBrandImageAction(kind, fd));
            }}
          />
          <Button type="button" variant="secondary" size="sm" loading={pending} onClick={() => input.current?.click()}>
            <ImagePlus aria-hidden />
            {url ? t("replace") : t("upload")}
          </Button>
          {url && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={pending}
              onClick={() => run(() => removeBrandImageAction(kind))}
            >
              <Trash2 aria-hidden />
              {t("remove")}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function BrandForm({ initial, locationName, sector, logoUrl, stampImageUrl, cardBgUrl, plan }: Props) {
  const t = useTranslations("owner.brand");
  const te = useTranslations("errors");
  const toast = useToast();
  const router = useRouter();
  const [b, setB] = useState(initial);
  const [pending, start] = useTransition();
  const set = <K extends keyof Brand>(k: K, v: Brand[K]) => setB((prev) => ({ ...prev, [k]: v }));
  const canLogo = allowsCustomization(plan, "logo");
  const canFull = allowsCustomization(plan, "full");
  const validHex = /^#[0-9a-f]{6}$/i.test(b.primary);
  const brand = validHex ? b : { ...b, primary: initial.primary };
  // La vista previa enseña lo que verán los clientes con el plan actual
  const shown = restrictBrand(brand, canFull ? "full" : canLogo ? "logo" : "color");
  const action = actionColor(brand.primary);
  const refresh = () => router.refresh();

  const save = () =>
    start(async () => {
      const r = await saveBrandAction({
        primary: brand.primary,
        font: brand.font,
        stampShape: brand.stampShape,
        stampMode: brand.stampMode,
        cardStyle: brand.cardStyle,
        stampIcon: brand.stampIcon,
      });
      if (r.ok) {
        toast({ tone: "success", text: t("saved") });
        refresh();
      } else toast({ tone: "danger", text: te(r.error as never) });
    });

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="flex flex-col gap-5">
        <Card className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">{t("logoTitle")}</h2>
          <Locked locked={!canLogo} need="basic">
            <ImageField kind="logo" url={logoUrl} label={t("logoTitle")} hint={t("logoHint")} onDone={refresh} />
          </Locked>
        </Card>

        <Card className="flex flex-col gap-4">
          <h2 className="text-lg font-bold">{t("colorTitle")}</h2>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="color"
              value={validHex ? b.primary : "#FF3B2E"}
              onChange={(e) => set("primary", e.target.value.toUpperCase())}
              aria-label={t("colorTitle")}
              className="size-12 cursor-pointer rounded-lg border-0 bg-transparent p-0"
            />
            <input
              value={b.primary}
              onChange={(e) => set("primary", e.target.value.toUpperCase())}
              maxLength={7}
              aria-label={t("colorHex")}
              inputMode="text"
              autoCapitalize="none"
              className="border-input bg-surface min-h-12 w-32 rounded-lg border px-3 font-mono text-base"
            />
          </div>
          <div className="flex flex-wrap gap-2" role="group" aria-label={t("presets")}>
            {PRESETS.map((c) => (
              <button
                key={c}
                type="button"
                aria-label={c}
                aria-pressed={b.primary.toUpperCase() === c}
                onClick={() => set("primary", c)}
                style={{ background: c }}
                className={cn(
                  "ring-cream-200 size-11 rounded-full ring-1",
                  b.primary.toUpperCase() === c && "ring-ink-950 ring-offset-surface ring-2 ring-offset-2",
                )}
              />
            ))}
          </div>
          {!validHex && <p className="text-danger text-sm">{t("colorInvalid")}</p>}
          <p className="text-muted flex items-center gap-2 text-sm">
            <span aria-hidden className="inline-block size-4 shrink-0 rounded-full" style={{ background: action }} />
            {t("colorNote")}
          </p>
        </Card>

        <Card className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">{t("iconTitle")}</h2>
          <Locked locked={!canLogo} need="basic">
            <div className="grid grid-cols-4 gap-2 sm:grid-cols-6" role="group" aria-label={t("iconTitle")}>
              <Choice
                active={b.stampIcon === null}
                onClick={() => set("stampIcon", null)}
                className="col-span-4 sm:col-span-6"
              >
                {t("iconDefault")}
              </Choice>
              {STAMP_ICONS.map((k) => {
                const Icon = STAMP_ICON_COMPONENTS[k];
                return (
                  <Choice
                    key={k}
                    active={b.stampIcon === k}
                    onClick={() => set("stampIcon", k)}
                    className="flex items-center justify-center"
                  >
                    <Icon className="size-6" aria-hidden />
                    <span className="sr-only">{t(`icons.${k}`)}</span>
                  </Choice>
                );
              })}
            </div>
          </Locked>
        </Card>

        <Card className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">{t("fontTitle")}</h2>
          <Locked locked={!canFull} need="plus">
            <div className="grid gap-2 sm:grid-cols-2">
              {FONT_KEYS.map((k) => (
                <Choice
                  key={k}
                  active={b.font === k}
                  onClick={() => set("font", k)}
                  style={{ fontFamily: FONTS[k].stack }}
                >
                  <span className="block text-lg leading-tight">{locationName}</span>
                  <span className="text-muted block text-xs font-normal">{FONTS[k].label}</span>
                </Choice>
              ))}
            </div>
          </Locked>
        </Card>

        <Card className="flex flex-col gap-4">
          <h2 className="text-lg font-bold">{t("stampsTitle")}</h2>
          <Locked locked={!canFull} need="plus">
            <div>
              <p className="mb-2 text-sm font-semibold">{t("shape")}</p>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {STAMP_SHAPES.map((s) => (
                  <Choice key={s} active={b.stampShape === s} onClick={() => set("stampShape", s)}>
                    {t(`shapes.${s}`)}
                  </Choice>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold">{t("content")}</p>
              <div className="grid grid-cols-3 gap-2">
                {STAMP_MODES.map((m) => (
                  <Choice key={m} active={b.stampMode === m} onClick={() => set("stampMode", m)}>
                    {t(`modes.${m}`)}
                  </Choice>
                ))}
              </div>
            </div>
            {b.stampMode === "image" && (
              <ImageField
                kind="stamp"
                url={stampImageUrl}
                label={t("stampImage")}
                hint={t("stampImageHint")}
                onDone={refresh}
              />
            )}
          </Locked>
        </Card>

        <Card className="flex flex-col gap-4">
          <h2 className="text-lg font-bold">{t("cardTitle")}</h2>
          <Locked locked={!canFull} need="plus">
            <div className="grid grid-cols-3 gap-2">
              {CARD_STYLES.map((s) => (
                <Choice key={s} active={b.cardStyle === s} onClick={() => set("cardStyle", s)}>
                  {t(`cardStyles.${s}`)}
                </Choice>
              ))}
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold">{t("cardBg")}</p>
              <ImageField kind="card" url={cardBgUrl} label={t("cardBg")} hint={t("cardBgHint")} onDone={refresh} />
            </div>
          </Locked>
        </Card>

        <Button type="button" size="lg" loading={pending} disabled={!validHex} onClick={save} className="self-start">
          {t("save")}
        </Button>
      </div>

      <aside className="lg:sticky lg:top-6 lg:self-start">
        <p className="text-muted mb-2 text-sm font-semibold">{t("preview")}</p>
        <div
          style={{ ...(themeVars(shown) as CSSProperties), fontFamily: "var(--font-sans)" }}
          className="bg-background ring-cream-200 flex flex-col gap-4 rounded-xl p-4 ring-1"
        >
          <div className="flex items-center gap-3">
            <BrandLogo url={shown.logo ? logoUrl : null} name={locationName} />
            <p className="font-display text-lg font-bold">{locationName}</p>
          </div>
          <StampCard
            total={8}
            filled={5}
            rewardName={t("sampleReward")}
            sector={sector}
            tone={shown.cardStyle}
            brand={{
              stampShape: shown.stampShape,
              stampMode: shown.stampMode,
              stampIcon: shown.stampIcon,
              stampImageUrl: shown.stampImage ? stampImageUrl : null,
              cardBgUrl: shown.cardBg ? cardBgUrl : null,
            }}
          />
          <span className="bg-primary inline-flex min-h-11 items-center justify-center rounded-lg px-5 font-semibold text-white">
            {t("sampleButton")}
          </span>
        </div>
      </aside>
    </div>
  );
}
