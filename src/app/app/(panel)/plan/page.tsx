import { Check } from "lucide-react";
import { getMessages, getTranslations } from "next-intl/server";
import { Alert, Button, Card } from "@/components/ui";
import { formatPrice, PLAN } from "@/config/plan";
import { trialDaysLeft, usageLevel } from "@/domain/plan";
import { requireOwner } from "@/server/auth/owner";
import { getPlanUsage } from "@/server/repositories/owner";
import { cn } from "@/lib/utils";

export default async function PlanPage() {
  const ctx = await requireOwner();
  const [t, messages, usage] = await Promise.all([
    getTranslations("owner.plan"),
    getMessages(),
    getPlanUsage(ctx.organization.id),
  ]);
  const level = usageLevel(usage.customers, usage.customerLimit);
  const pct = usage.customerLimit ? Math.min(100, Math.round((usage.customers / usage.customerLimit) * 100)) : 0;
  const freeFeatures = Object.values(messages.owner.plan.freeFeatures);
  const proFeatures = Object.values(messages.owner.plan.proFeatures);

  const plans = [
    {
      key: "free" as const,
      name: t("freeName"),
      price: t("free"),
      features: freeFeatures,
      active: usage.plan === "free",
    },
    {
      key: "pro" as const,
      name: t("proName"),
      price: t("price", { price: formatPrice(ctx.organization.currency) }),
      features: proFeatures,
      active: usage.plan === "pro",
    },
  ];

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <h1 className="text-3xl font-extrabold">{t("title")}</h1>

      <Card className="flex flex-col gap-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <p className="text-muted text-sm font-semibold">{t("current")}</p>
            <h2 className="font-display text-2xl font-extrabold">{t(`names.${usage.plan}`)}</h2>
          </div>
          <p className="text-sm font-semibold">
            {usage.customerLimit !== null
              ? t("usageOf", { count: usage.customers, limit: usage.customerLimit })
              : t("usageUnlimited", { count: usage.customers })}
          </p>
        </div>
        {usage.customerLimit !== null && (
          <div
            role="progressbar"
            aria-label={t("usage")}
            aria-valuemin={0}
            aria-valuemax={usage.customerLimit}
            aria-valuenow={usage.customers}
            className="h-3 overflow-hidden rounded-full bg-blue-100"
          >
            <div
              className={cn(
                "h-full rounded-full",
                level === "full" ? "bg-danger" : level === "near" ? "bg-warning" : "bg-primary",
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
        <p className="text-muted text-sm">
          {usage.plan === "trial"
            ? t("trialBody", { count: trialDaysLeft(ctx.organization.trialEndsAt), limit: PLAN.freeCustomerLimit })
            : usage.plan === "free"
              ? t("freeBody", { limit: PLAN.freeCustomerLimit })
              : t("proBody")}
        </p>
        <p className="text-muted text-xs">{t("usageHint")}</p>
      </Card>

      {level === "full" && (
        <Alert tone="danger" title={t("fullTitle")}>
          {t("fullBody")}
        </Alert>
      )}
      {level === "near" && usage.customerLimit !== null && (
        <Alert tone="warning" title={t("nearTitle")}>
          {t("nearBody", { left: usage.customerLimit - usage.customers })}
        </Alert>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {plans.map((p) => (
          <Card key={p.key} className={cn("flex flex-col gap-4", p.key === "pro" && "ring-2 ring-blue-600")}>
            <div>
              <h2 className="font-display text-xl font-extrabold">{p.name}</h2>
              <p className="font-display text-primary text-3xl font-extrabold">{p.price}</p>
            </div>
            <ul className="flex flex-1 flex-col gap-2">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="text-success mt-0.5 size-5 shrink-0" aria-hidden />
                  {f}
                </li>
              ))}
            </ul>
            {p.key === "pro" && !p.active && <Button disabled>{t("upgrade")}</Button>}
          </Card>
        ))}
      </div>
      <p className="text-muted text-sm">{t("soon")}</p>
    </div>
  );
}
