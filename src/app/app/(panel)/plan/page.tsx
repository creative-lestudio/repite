import { Check } from "lucide-react";
import { getMessages, getTranslations } from "next-intl/server";
import { Alert, Button, Card } from "@/components/ui";
import { formatPrice } from "@/config/plan";
import { requireOwner } from "@/server/auth/owner";

export default async function PlanPage() {
  const ctx = await requireOwner();
  const t = await getTranslations("owner.plan");
  const features = Object.values((await getMessages()).owner.plan.features);
  const days = ctx.organization.trialEndsAt
    ? Math.max(0, Math.ceil((new Date(ctx.organization.trialEndsAt).getTime() - Date.now()) / 86_400_000))
    : 0;

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <h1 className="text-3xl font-extrabold">{t("title")}</h1>

      {ctx.organization.plan === "trial" && (
        <Alert tone={days <= 5 ? "warning" : "info"} title={t("trialName")}>
          {t("trialBody", { count: days })}
        </Alert>
      )}

      <Card className="flex flex-col gap-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <p className="text-muted text-sm font-semibold">{t("current")}</p>
            <h2 className="font-display text-2xl font-extrabold">{t("proName")}</h2>
          </div>
          <p className="font-display text-primary text-3xl font-extrabold">
            {t("price", { price: formatPrice(ctx.organization.currency) })}
          </p>
        </div>
        <ul className="flex flex-col gap-2">
          {features.map((f) => (
            <li key={f} className="flex items-start gap-2">
              <Check className="text-success mt-0.5 size-5 shrink-0" aria-hidden />
              {f}
            </li>
          ))}
        </ul>
        <Button disabled>{t("contact")}</Button>
        <p className="text-muted text-sm">{t("soon")}</p>
      </Card>
    </div>
  );
}
