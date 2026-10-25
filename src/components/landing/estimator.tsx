"use client";

import { useId, useState } from "react";
import { useTranslations } from "next-intl";
import { PLAN_ORDER, PLANS, type PlanId } from "@/config/plan";
import { estimateScenario } from "@/domain/estimator";

const money = (n: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(n);

function NumberField({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  suffix?: string;
}) {
  const id = useId();
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-semibold">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          min={0}
          value={Number.isFinite(value) ? value : ""}
          onChange={(e) => onChange(e.target.value === "" ? 0 : Number(e.target.value))}
          className="border-input bg-surface min-h-11 w-full rounded-lg border px-3 pr-10 text-base"
        />
        {suffix && (
          <span aria-hidden className="text-muted pointer-events-none absolute inset-y-0 right-3 flex items-center">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

/** Escenario hipotético: el dueño pone sus cifras; no hay resultados prometidos. */
export function Estimator() {
  const t = useTranslations("landing.estimator");
  const tp = useTranslations("plans");
  const [ticket, setTicket] = useState(7);
  const [margin, setMargin] = useState(60);
  const [visits, setVisits] = useState(20);
  const [rewardCost, setRewardCost] = useState(1.5);
  const [rewards, setRewards] = useState(4);
  const [campaign, setCampaign] = useState(0);
  const [plan, setPlan] = useState<PlanId>("esencial");
  const planId = useId();

  const r = estimateScenario({
    ticket,
    marginPct: margin,
    extraVisits: visits,
    rewardCost,
    rewardsPerMonth: rewards,
    campaignCost: campaign,
    subscription: PLANS[plan].price,
  });

  return (
    <div className="bg-surface shadow-card ring-cream-200 mx-auto mt-16 max-w-4xl rounded-2xl p-6 ring-1 md:p-8">
      <h3 className="text-2xl font-extrabold">{t("title")}</h3>
      <p className="text-muted mt-1">{t("subtitle")}</p>
      <div className="mt-6 grid gap-6 md:grid-cols-[1.2fr_1fr]">
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberField label={t("ticket")} value={ticket} onChange={setTicket} suffix="€" />
          <NumberField label={t("margin")} value={margin} onChange={setMargin} suffix="%" />
          <NumberField label={t("visits")} value={visits} onChange={setVisits} />
          <NumberField label={t("rewards")} value={rewards} onChange={setRewards} />
          <NumberField label={t("rewardCost")} value={rewardCost} onChange={setRewardCost} suffix="€" />
          <NumberField label={t("campaign")} value={campaign} onChange={setCampaign} suffix="€" />
          <div className="flex flex-col gap-1 sm:col-span-2">
            <label htmlFor={planId} className="text-sm font-semibold">
              {t("plan")}
            </label>
            <select
              id={planId}
              value={plan}
              onChange={(e) => setPlan(e.target.value as PlanId)}
              className="border-input bg-surface min-h-11 rounded-lg border px-3 text-base"
            >
              {PLAN_ORDER.map((p) => (
                <option key={p} value={p}>
                  {tp(`names.${p}`)} · {money(PLANS[p].price)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="bg-ink-950 text-cream-50 flex flex-col gap-3 rounded-xl p-5" aria-live="polite">
          <p className="text-cream-200 text-sm font-semibold">{t("resultTitle")}</p>
          <dl className="flex flex-col gap-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt>{t("extraSales")}</dt>
              <dd className="font-bold">{money(r.extraSales)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>{t("extraMargin")}</dt>
              <dd className="font-bold">{money(r.extraMargin)}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt>{t("costs")}</dt>
              <dd className="font-bold">−{money(r.costs)}</dd>
            </div>
            <div className="flex justify-between gap-3 border-t border-white/20 pt-2 text-base">
              <dt>{t("net")}</dt>
              <dd className={r.net >= 0 ? "font-extrabold" : "font-extrabold text-red-500"}>{money(r.net)}</dd>
            </div>
          </dl>
          <p className="text-cream-200 text-sm">
            {r.breakEvenVisits === null ? t("noBreakEven") : t("breakEven", { visits: r.breakEvenVisits })}
          </p>
        </div>
      </div>
      <p className="text-muted mt-4 text-xs">{t("disclaimer")}</p>
    </div>
  );
}
