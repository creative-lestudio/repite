"use client";

import { Crown, Gift, QrCode, Ticket } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { StampCard, type StampCardBrand } from "@/components/stamp-card/stamp-card";
import { Alert, Button } from "@/components/ui";
import { WalletButtons } from "./wallet-buttons";
import { currentLevel, nextLevel } from "@/domain/levels";
import { getCardStateAction } from "@/server/actions/customer";
import type { CardState } from "@/server/repositories/customers";

const POLL_MS = 5000;

interface Props {
  slug: string;
  customerName: string;
  sector: string;
  qrSvg: string;
  initial: CardState;
  welcome: boolean;
  wallet: { apple: boolean; google: boolean };
  cardTone: "light" | "dark" | "brand";
  cardBrand: StampCardBrand;
}

type Snapshot = { balance: number; rewards: number };

function readSnapshot(key: string): Snapshot | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Snapshot) : null;
  } catch {
    return null;
  }
}

function writeSnapshot(key: string, s: Snapshot) {
  try {
    localStorage.setItem(key, JSON.stringify(s));
  } catch {
    // almacenamiento no disponible (modo privado): solo perdemos la animación diferida
  }
}

/** Tarjeta que se refresca sola: cuando el equipo suma un sello, aparece estampado al momento. */
export function LiveCard({ slug, customerName, sector, qrSvg, initial, welcome, wallet, cardTone, cardBrand }: Props) {
  const t = useTranslations("customer.card");
  const [state, setState] = useState(initial);
  const [newStamp, setNewStamp] = useState<number | null>(null);
  const [rewardWon, setRewardWon] = useState(false);
  const [showCode, setShowCode] = useState(welcome);
  const key = `repite:card:${slug}`;
  const prev = useRef<Snapshot | null>(null);

  const apply = useCallback(
    (next: CardState) => {
      const snap = { balance: next.balance, rewards: next.rewards.length };
      const before = prev.current;
      if (before) {
        if (snap.rewards > before.rewards) {
          setRewardWon(true);
          setNewStamp(null);
        } else if (snap.balance > before.balance) {
          setNewStamp(snap.balance);
        }
      }
      prev.current = snap;
      writeSnapshot(key, snap);
      setState(next);
    },
    [key],
  );

  // Al abrir: compara con lo último que vio este móvil para animar sellos sumados mientras estaba cerrado
  useEffect(() => {
    prev.current = readSnapshot(key) ?? { balance: initial.balance, rewards: initial.rewards.length };
    apply(initial);
  }, [apply, initial, key]);

  useEffect(() => {
    const tick = async () => {
      if (document.visibilityState !== "visible") return;
      try {
        const next = await getCardStateAction(slug);
        if (next) apply(next);
      } catch {
        // sin conexión: se reintenta en el siguiente ciclo
      }
    };
    const timer = setInterval(tick, POLL_MS);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [apply, slug]);

  if (!state.program) {
    return <Alert tone="info">{t("noProgram")}</Alert>;
  }

  const rewards = state.rewards.length;
  const level = currentLevel(state.levels, state.visits_total);
  const upcoming = nextLevel(state.levels, state.visits_total);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold">{t("hello", { name: customerName })}</h1>
      {welcome && <Alert tone="success">{t("welcome")}</Alert>}
      {rewardWon && <Alert tone="success" title={t("rewardWon")} className="animate-fade-in" />}

      <StampCard
        total={state.program.stamps_required}
        filled={state.balance}
        newStamp={newStamp}
        sector={sector}
        tone={cardTone}
        brand={cardBrand}
        rewardName={state.program.reward_name}
      />

      {state.levels.length > 0 && (
        <section
          aria-label={t("levelTitle")}
          className="bg-ink-950 text-cream-50 flex items-start gap-3 rounded-xl p-4"
        >
          <Crown className="mt-0.5 size-6 shrink-0 text-red-500" aria-hidden />
          <div className="text-sm">
            <p className="font-display text-lg font-extrabold">
              {level ? t("levelNow", { name: level.name }) : t("levelNone")}
            </p>
            {level?.perk && <p className="text-cream-200">{level.perk}</p>}
            <p className="text-cream-200 mt-1">
              {upcoming ? t("levelNext", { missing: upcoming.missing, next: upcoming.level.name }) : t("levelTop")}
            </p>
          </div>
        </section>
      )}

      {state.coupons.length > 0 && (
        <Link
          href={`/c/${slug}/premios`}
          className="bg-primary-soft text-ink-950 ring-cream-200 hover:bg-cream-200 flex min-h-14 items-center gap-3 rounded-xl px-4 ring-1"
        >
          <Ticket className="text-primary size-6 shrink-0" aria-hidden />
          <span className="flex-1 font-semibold">{t("couponsReady", { count: state.coupons.length })}</span>
          <span className="text-primary text-sm font-semibold underline underline-offset-4">{t("couponsAction")}</span>
        </Link>
      )}

      {rewards > 0 && (
        <Link
          href={`/c/${slug}/premios`}
          className="bg-primary-soft text-ink-950 ring-cream-200 hover:bg-cream-200 flex min-h-14 items-center gap-3 rounded-xl px-4 ring-1"
        >
          <Gift className="text-primary size-6 shrink-0" aria-hidden />
          <span className="flex-1 font-semibold">{t("rewardReady", { count: rewards })}</span>
          <span className="text-primary text-sm font-semibold underline underline-offset-4">
            {t("rewardReadyAction")}
          </span>
        </Link>
      )}

      {state.pending_bonuses.length > 0 && (
        <p className="text-muted text-sm">{t("pendingBonus", { count: state.pending_bonuses.length })}</p>
      )}

      <WalletButtons slug={slug} apple={wallet.apple} google={wallet.google} />
      <Button
        variant={showCode ? "secondary" : "primary"}
        size="lg"
        block
        onClick={() => setShowCode((v) => !v)}
        aria-expanded={showCode}
        aria-controls="my-code"
      >
        <QrCode aria-hidden />
        {showCode ? t("hideCode") : t("showCode")}
      </Button>
      {showCode && (
        <div
          id="my-code"
          className="bg-surface shadow-card animate-fade-in ring-cream-100 flex flex-col items-center gap-3 rounded-xl p-5 ring-1"
        >
          <div
            role="img"
            aria-label={t("codeAlt", { name: customerName })}
            className="w-full max-w-60 [&_svg]:h-auto [&_svg]:w-full"
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
          <p className="text-muted text-center text-sm">{t("codeHint")}</p>
        </div>
      )}
    </div>
  );
}
