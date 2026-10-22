import { ArrowDown, ArrowUp, Lock } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { BarChart } from "@/components/owner/bar-chart";
import { Card } from "@/components/ui";
import { allowsCustomization } from "@/domain/plan";
import { estimatedRevenue, pctChange, peakHour, returnRate, visitsPerCustomer } from "@/domain/metrics";
import { requireOwner } from "@/server/auth/owner";
import { getMetrics } from "@/server/repositories/owner";
import { cn } from "@/lib/utils";

export const metadata = { title: "Resultados" };

const PERIODS = [7, 30, 90] as const;

function Delta({ cur, prev }: { cur: number; prev: number }) {
  const pct = pctChange(cur, prev);
  if (pct === null) return null;
  const up = pct >= 0;
  const Icon = up ? ArrowUp : ArrowDown;
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-xs font-semibold", up ? "text-success" : "text-danger")}>
      <Icon className="size-3.5" aria-hidden />
      {Math.abs(pct)} %
    </span>
  );
}

export default async function ResultsPage({ searchParams }: { searchParams: Promise<{ dias?: string }> }) {
  const ctx = await requireOwner();
  const sp = await searchParams;
  const days = (PERIODS as readonly number[]).includes(Number(sp.dias)) ? Number(sp.dias) : 30;
  const [t, m] = await Promise.all([getTranslations("owner.results"), getMetrics(ctx, days)]);
  // allowsCustomization("full") equivale a tener las funciones de Plus (o la prueba)
  const full = allowsCustomization(ctx.organization.effectivePlan, "full");
  const ticket = Number(ctx.location.settings.average_ticket ?? 0) || null;
  const revenue = estimatedRevenue(m.repeatVisits, ticket);
  const currency = ctx.organization.currency;
  const money = (n: number) =>
    new Intl.NumberFormat("es-ES", { style: "currency", currency, maximumFractionDigits: 0 }).format(n);
  const peak = peakHour(m.byHour);

  const cards = [
    { label: t("visits"), value: m.visits, delta: full ? <Delta cur={m.visits} prev={m.visitsPrev} /> : null },
    {
      label: t("active"),
      value: m.activeCustomers,
      delta: full ? <Delta cur={m.activeCustomers} prev={m.activeCustomersPrev} /> : null,
    },
    {
      label: t("newCustomers"),
      value: m.newCustomers,
      delta: full ? <Delta cur={m.newCustomers} prev={m.newCustomersPrev} /> : null,
    },
    { label: t("returnRate"), value: `${returnRate(m)} %`, delta: null },
  ];

  return (
    <div className="flex max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">{t("title")}</h1>
          <p className="text-muted mt-1">{t("subtitle")}</p>
        </div>
        <nav aria-label={t("period")} className="bg-surface ring-cream-200 flex rounded-full p-1 ring-1">
          {PERIODS.map((d) => (
            <Link
              key={d}
              href={`/app/resultados?dias=${d}`}
              aria-current={d === days ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center rounded-full px-4 text-sm font-semibold",
                d === days ? "bg-primary text-white" : "text-muted hover:text-foreground",
              )}
            >
              {t("lastDays", { count: d })}
            </Link>
          ))}
        </nav>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label} className="flex flex-col gap-1">
            <p className="text-muted text-sm font-semibold">{c.label}</p>
            <p className="font-display text-3xl font-extrabold">{c.value}</p>
            {c.delta ?? <span className="h-4" />}
          </Card>
        ))}
      </div>

      {full ? (
        <>
          <Card className="bg-ink-950 text-cream-50 flex flex-col gap-2">
            <p className="text-cream-200 text-sm font-semibold">{t("revenueTitle")}</p>
            {revenue !== null ? (
              <>
                <p className="font-display text-4xl font-extrabold text-red-500">{money(revenue)}</p>
                <p className="text-cream-200 text-sm">
                  {t("revenueBody", { visits: m.repeatVisits, ticket: money(ticket ?? 0) })}
                </p>
              </>
            ) : (
              <p className="text-sm">
                {t("revenueNoTicket")}{" "}
                <Link href="/app/ajustes" className="font-semibold underline">
                  {t("revenueSetTicket")}
                </Link>
              </p>
            )}
          </Card>

          <Card className="flex flex-col gap-3">
            <h2 className="text-lg font-bold">{t("dailyTitle")}</h2>
            <BarChart
              data={m.daily.map((d) => ({ label: d.day.slice(5).split("-").reverse().join("/"), value: d.visits }))}
              label={t("dailyTitle")}
              valueLabel={t("visits")}
            />
          </Card>

          <div className="grid gap-6 md:grid-cols-2">
            <Card className="flex flex-col gap-3">
              <h2 className="text-lg font-bold">{t("hoursTitle")}</h2>
              <BarChart
                data={m.byHour.map((h) => ({ label: `${h.hour}h`, value: h.visits }))}
                label={t("hoursTitle")}
                valueLabel={t("visits")}
              />
              {peak !== null && <p className="text-muted text-sm">{t("peak", { hour: peak })}</p>}
            </Card>
            <Card className="flex flex-col gap-2">
              <h2 className="text-lg font-bold">{t("loyaltyTitle")}</h2>
              <dl className="flex flex-col gap-3">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">{t("perCustomer")}</dt>
                  <dd className="font-bold">{visitsPerCustomer(m)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">{t("returning")}</dt>
                  <dd className="font-bold">{m.returningCustomers}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">{t("rewardsIssued")}</dt>
                  <dd className="font-bold">{m.rewardsIssued}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted">{t("rewardsRedeemed")}</dt>
                  <dd className="font-bold">{m.rewardsRedeemed}</dd>
                </div>
              </dl>
            </Card>
          </div>
        </>
      ) : (
        <Card className="flex flex-col items-start gap-3">
          <p className="flex items-center gap-2 font-bold">
            <Lock className="size-5" aria-hidden />
            {t("lockedTitle")}
          </p>
          <p className="text-muted">{t("lockedBody")}</p>
          <Link href="/app/plan" className="text-primary font-semibold underline underline-offset-4">
            {t("lockedCta")}
          </Link>
        </Card>
      )}
    </div>
  );
}
