import { CheckCircle2, Circle, QrCode, Users } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Badge, Button, Card, EmptyState } from "@/components/ui";
import { requireOwner } from "@/server/auth/owner";
import { getDashboardStats, getPlanUsage } from "@/server/repositories/owner";
import { usageLevel } from "@/domain/plan";
import { Alert } from "@/components/ui";

export default async function OwnerHome() {
  const ctx = await requireOwner();
  const [t, stats, usage] = await Promise.all([
    getTranslations("owner.home"),
    getDashboardStats(ctx),
    getPlanUsage(ctx.organization.id),
  ]);
  const level = usageLevel(usage.customers, usage.customerLimit);

  const steps = [
    { key: "account" as const, done: true as boolean, href: null as string | null },
    { key: "program" as const, done: stats.hasProgram, href: "/app/programa" },
    { key: "qr" as const, done: !!ctx.organization.onboarding.qr, href: "/app/qr" },
    { key: "team" as const, done: !!ctx.organization.onboarding.team || stats.staff > 0, href: "/app/equipo" },
  ];
  const done = steps.filter((s) => s.done).length;

  const trialDays =
    usage.plan === "trial" && ctx.organization.trialEndsAt
      ? Math.max(0, Math.ceil((new Date(ctx.organization.trialEndsAt).getTime() - Date.now()) / 86_400_000))
      : null;

  const cards = [
    { label: t("customers"), value: stats.customers, href: "/app/clientes" },
    { label: t("visitsToday"), value: stats.visitsToday, href: null },
    { label: t("rewardsReady"), value: stats.rewardsReady, href: "/app/clientes?filtro=premio" },
    { label: t("pendingBonuses"), value: stats.pendingBonuses, href: "/app/extras" },
  ];

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <h1 className="text-3xl font-extrabold">{t("greeting", { name: ctx.location.name })}</h1>
        {trialDays !== null && (
          <Link href="/app/plan">
            <Badge tone={trialDays <= 5 ? "warning" : "blue"} className="px-3 py-1.5 text-sm">
              {t("trial", { count: trialDays })}
            </Badge>
          </Link>
        )}
        {usage.plan === "free" && (
          <Link href="/app/plan">
            <Badge tone="blue" className="px-3 py-1.5 text-sm">
              {t("planFree")}
            </Badge>
          </Link>
        )}
      </header>

      {usage.customerLimit !== null && level !== "ok" && (
        <Alert tone={level === "full" ? "danger" : "warning"}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <span>
              {level === "full"
                ? t("planFull", { limit: usage.customerLimit })
                : t("planNear", { count: usage.customers, limit: usage.customerLimit })}
            </span>
            <Button asChild size="sm" variant={level === "full" ? "primary" : "secondary"}>
              <Link href="/app/plan">{t("planAction")}</Link>
            </Button>
          </div>
        </Alert>
      )}

      {done < steps.length ? (
        <section
          aria-labelledby="checklist"
          className="bg-surface shadow-card ring-cream-100 flex flex-col gap-4 rounded-xl p-5 ring-1"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 id="checklist" className="text-xl font-bold">
              {t("checklistTitle")}
            </h2>
            <p className="text-muted text-sm">{t("checklistDone", { done, total: steps.length })}</p>
          </div>
          <div
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={steps.length}
            aria-valuenow={done}
            aria-label={t("checklistTitle")}
            className="bg-cream-100 h-2 overflow-hidden rounded-full"
          >
            <div
              className="bg-primary h-full rounded-full transition-all"
              style={{ width: `${(done / steps.length) * 100}%` }}
            />
          </div>
          <ol className="flex flex-col gap-3">
            {steps.map((s) => (
              <li key={s.key} className="flex items-start gap-3">
                {s.done ? (
                  <CheckCircle2 className="text-success mt-0.5 size-6 shrink-0" aria-hidden />
                ) : (
                  <Circle className="text-cream-200 mt-0.5 size-6 shrink-0" aria-hidden />
                )}
                <div className="flex flex-1 flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className={s.done ? "text-muted font-semibold line-through" : "font-semibold"}>
                      {t(`steps.${s.key}.title`)}
                    </p>
                    {!s.done && s.key !== "account" && <p className="text-muted text-sm">{t(`steps.${s.key}.body`)}</p>}
                  </div>
                  {!s.done && s.href && s.key !== "account" && (
                    <Button asChild size="sm">
                      <Link href={s.href}>{t(`steps.${s.key}.action`)}</Link>
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <section aria-labelledby="stats" className="flex flex-col gap-3">
        <h2 id="stats" className="text-xl font-bold">
          {t("statsTitle")}
        </h2>
        <ul className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {cards.map((c) => {
            const inner = (
              <Card className="h-full p-4">
                <p className="text-muted text-sm font-semibold">{c.label}</p>
                <p className="font-display mt-1 text-3xl font-extrabold">{c.value}</p>
              </Card>
            );
            return (
              <li key={c.label}>
                {c.href ? (
                  <Link href={c.href} className="hover:ring-cream-200 block h-full rounded-xl hover:ring-2">
                    {inner}
                  </Link>
                ) : (
                  inner
                )}
              </li>
            );
          })}
        </ul>
      </section>

      {stats.customers === 0 && (
        <EmptyState
          icon={<Users />}
          title={t("emptyTitle")}
          description={t("emptyBody")}
          action={
            <Button asChild>
              <Link href="/app/qr">
                <QrCode aria-hidden />
                {t("emptyAction")}
              </Link>
            </Button>
          }
        />
      )}
    </div>
  );
}
