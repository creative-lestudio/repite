"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { PlanCards } from "@/components/plans/plan-cards";
import { PlanTable } from "@/components/plans/plan-table";
import { Button } from "@/components/ui";
import { PLANS } from "@/config/plan";
import { cn } from "@/lib/utils";

type Currency = "EUR" | "USD";

const money = (currency: Currency, amount: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency, maximumFractionDigits: 0 }).format(amount);

function Roi({ currency, ticket, setTicket }: { currency: Currency; ticket: number; setTicket: (n: number) => void }) {
  const t = useTranslations("landing.pricing.roi");
  const tp = useTranslations("plans.names");
  const [visits, setVisits] = useState(20);
  const revenue = ticket * visits;
  return (
    <div className="bg-ink-950 text-cream-50 mt-12 rounded-2xl p-6 md:p-10">
      <h3 className="font-display text-2xl font-extrabold md:text-3xl">{t("title")}</h3>
      <p className="text-cream-200 mt-1">{t("subtitle")}</p>
      <div className="mt-6 grid gap-6 md:grid-cols-2">
        <div className="flex flex-col gap-5">
          <label className="flex flex-col gap-2">
            <span className="flex justify-between font-semibold">
              {t("ticket")}
              <output className="text-red-500">{money(currency, ticket)}</output>
            </span>
            <input
              type="range"
              min={2}
              max={40}
              step={1}
              value={ticket}
              onChange={(e) => setTicket(Number(e.target.value))}
              className="accent-red-500"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="flex justify-between font-semibold">
              {t("visits")}
              <output className="text-red-500">{visits}</output>
            </span>
            <input
              type="range"
              min={0}
              max={200}
              step={5}
              value={visits}
              onChange={(e) => setVisits(Number(e.target.value))}
              className="accent-red-500"
            />
          </label>
        </div>
        <div className="flex flex-col gap-3" aria-live="polite">
          <p>
            {t("revenue")}: <strong className="font-display text-3xl text-red-500">{money(currency, revenue)}</strong>
          </p>
          <ul className="flex flex-col gap-2 text-sm">
            {(["basic", "plus"] as const).map((p) => {
              const net = revenue - PLANS[p].price[currency];
              return (
                <li key={p} className="flex justify-between gap-3 rounded-lg bg-white/10 px-3 py-2">
                  <span>{t("after", { plan: tp(p) })}</span>
                  <strong className={net >= 0 ? "text-cream-50" : "text-red-500"}>{money(currency, net)}</strong>
                </li>
              );
            })}
          </ul>
          <p className="text-cream-200 text-xs">{t("note")}</p>
        </div>
      </div>
    </div>
  );
}

export function Pricing() {
  const t = useTranslations("landing.pricing");
  const [currency, setCurrency] = useState<Currency>("EUR");
  const [ticket, setTicket] = useState(7);

  return (
    <section id="precio" aria-labelledby="pricing-title" className="scroll-mt-16 px-4 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 id="pricing-title" className="text-3xl font-extrabold md:text-5xl">
            {t("title")}
          </h2>
          <p className="text-muted mt-3 text-lg">{t("subtitle")}</p>
        </div>

        <div className="mt-8 flex flex-col items-center gap-2">
          <p className="text-muted text-sm font-semibold">{t("country")}</p>
          <div
            role="group"
            aria-label={t("country")}
            className="bg-surface ring-cream-200 flex rounded-full p-1 ring-1"
          >
            {(["EUR", "USD"] as const).map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={currency === c}
                onClick={() => {
                  setCurrency(c);
                  setTicket(c === "EUR" ? 7 : 5);
                }}
                className={cn(
                  "min-h-11 rounded-full px-5 text-sm font-semibold transition-colors",
                  currency === c ? "bg-primary text-white" : "text-muted hover:text-foreground",
                )}
              >
                {t(c === "EUR" ? "spain" : "venezuela")}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10">
          <PlanCards
            currency={currency}
            ticket={ticket}
            renderCta={(plan) => (
              <Button asChild size="lg" variant={plan === "basic" ? "primary" : "secondary"} block>
                <Link href="/registro">{plan === "starter" ? t("ctaFree") : t("ctaTrial")}</Link>
              </Button>
            )}
          />
        </div>
        <p className="text-muted mx-auto mt-6 max-w-2xl text-center text-sm">
          <span className="text-primary font-semibold">{t("badge")}.</span> {t("trialNote")}
        </p>

        <Roi currency={currency} ticket={ticket} setTicket={setTicket} />

        <details className="group mt-10">
          <summary className="text-primary mx-auto min-h-11 w-fit cursor-pointer py-3 text-center font-semibold underline-offset-4 hover:underline">
            {t("compare")}
          </summary>
          <div className="mt-4">
            <PlanTable highlight="basic" />
          </div>
        </details>

        <ul className="text-muted mx-auto mt-8 grid max-w-3xl gap-2 text-sm sm:grid-cols-3">
          {(["g1", "g2", "g3"] as const).map((k) => (
            <li key={k} className="bg-surface ring-cream-200 rounded-lg p-3 text-center ring-1">
              {t(`guarantees.${k}`)}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
