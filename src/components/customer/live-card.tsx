"use client";

import { Gift, QrCode } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { StampCard } from "@/components/stamp-card/stamp-card";
import { Alert, Button } from "@/components/ui";
import { getCardStateAction } from "@/server/actions/customer";
import type { CardState } from "@/server/repositories/customers";

const POLL_MS = 5000;

interface Props {
  slug: string;
  customerName: string;
  qrSvg: string;
  initial: CardState;
  welcome: boolean;
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
export function LiveCard({ slug, customerName, qrSvg, initial, welcome }: Props) {
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

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold">{t("hello", { name: customerName })}</h1>
      {welcome && <Alert tone="success">{t("welcome")}</Alert>}
      {rewardWon && <Alert tone="success" title={t("rewardWon")} className="animate-fade-in" />}

      <StampCard
        total={state.program.stamps_required}
        filled={state.balance}
        newStamp={newStamp}
        rewardName={state.program.reward_name}
      />

      {rewards > 0 && (
        <Link
          href={`/c/${slug}/premios`}
          className="bg-primary-soft flex min-h-14 items-center gap-3 rounded-xl px-4 text-blue-950 ring-1 ring-blue-200 hover:bg-blue-200"
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
          className="bg-surface shadow-card animate-fade-in flex flex-col items-center gap-3 rounded-xl p-5 ring-1 ring-blue-100"
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
