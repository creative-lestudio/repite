import { getTranslations } from "next-intl/server";
import { PlanPicker } from "@/components/owner/plan-picker";
import { Alert, Card } from "@/components/ui";
import { PLANS } from "@/config/plan";
import { planSpec, trialDaysLeft, usageLevel } from "@/domain/plan";
import { requireOwner } from "@/server/auth/owner";
import { getPlanUsage } from "@/server/repositories/owner";
import { cn } from "@/lib/utils";
import { CONTACT_EMAIL } from "@/config/contact";

export const metadata = { title: "Plan y facturación" };

function Meter({ label, used, limit, text }: { label: string; used: number; limit: number | null; text: string }) {
  const level = usageLevel(used, limit);
  const pct = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-semibold">{label}</span>
        <span className="text-muted">{text}</span>
      </div>
      {limit !== null && (
        <div
          role="progressbar"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={limit}
          aria-valuenow={used}
          className="bg-cream-100 h-2.5 overflow-hidden rounded-full"
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
    </div>
  );
}

export default async function PlanPage() {
  const ctx = await requireOwner();
  const [t, tp, usage] = await Promise.all([
    getTranslations("owner.plan"),
    getTranslations("plans"),
    getPlanUsage(ctx.organization.id),
  ]);
  const spec = planSpec(usage.plan);
  const level = usageLevel(usage.customers, usage.customerLimit);
  const contactEmail = CONTACT_EMAIL;

  const text = (used: number, limit: number | null) =>
    limit === null ? t("noLimit", { count: used }) : t("of", { count: used, limit });

  const body =
    usage.plan === "trial"
      ? t("trialBody", { count: trialDaysLeft(ctx.organization.trialEndsAt), limit: PLANS.starter.customers ?? 0 })
      : usage.plan === "starter"
        ? t("starterBody", { limit: PLANS.starter.customers ?? 0 })
        : usage.plan === "esencial"
          ? t("basicBody")
          : t("plusBody");

  return (
    <div className="flex max-w-5xl flex-col gap-6">
      <h1 className="text-3xl font-extrabold">{t("title")}</h1>

      <Card className="flex flex-col gap-4">
        <div>
          <p className="text-muted text-sm font-semibold">{t("current")}</p>
          <h2 className="font-display text-2xl font-extrabold">{tp(`names.${usage.plan}`)}</h2>
          <p className="text-muted mt-1 text-sm">{body}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Meter
            label={t("usage")}
            used={usage.customers}
            limit={usage.customerLimit}
            text={text(usage.customers, usage.customerLimit)}
          />
          <Meter label={t("staffLabel")} used={usage.staff} limit={spec.staff} text={text(usage.staff, spec.staff)} />
          <Meter
            label={t("devicesLabel")}
            used={usage.devices}
            limit={spec.devices}
            text={text(usage.devices, spec.devices)}
          />
        </div>
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

      <PlanPicker current={usage.plan} locationName={ctx.location.name} contactEmail={contactEmail} />
      <p className="text-muted text-sm">{t("soon")}</p>
    </div>
  );
}
