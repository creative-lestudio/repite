"use client";

import { useTranslations } from "next-intl";
import { PlanCards } from "@/components/plans/plan-cards";
import { PlanTable } from "@/components/plans/plan-table";
import { Button } from "@/components/ui";
import type { PlanId } from "@/config/plan";

/** Planes del panel: el cambio se pide por correo mientras no haya pago online. */
export function PlanPicker({
  current,
  locationName,
  contactEmail,
}: {
  current: string;
  locationName: string;
  contactEmail: string;
}) {
  const t = useTranslations("owner.plan");
  const tp = useTranslations("plans");
  const ticket = 7;
  const href = (plan: PlanId | "red") =>
    `mailto:${contactEmail}?subject=${encodeURIComponent(t("mailSubject", { plan: plan }))}&body=${encodeURIComponent(
      t("mailBody", { plan, location: locationName }),
    )}`;

  return (
    <div className="flex flex-col gap-6">
      <PlanCards
        ticket={ticket}
        current={current}
        renderCta={(plan) =>
          plan === "starter" || current === plan ? (
            <Button disabled variant="secondary">
              {current === plan ? t("currentPlan") : t("freeAlways")}
            </Button>
          ) : (
            <Button asChild>
              <a href={href(plan)}>{t("request", { plan })}</a>
            </Button>
          )
        }
        renderRedCta={() => (
          <Button asChild variant="secondary">
            <a href={href("red")}>{tp("requestInfo")}</a>
          </Button>
        )}
      />
      <p className="text-muted text-xs">{tp("priceNote")}</p>
      <details className="group">
        <summary className="text-primary min-h-11 cursor-pointer py-3 font-semibold underline-offset-4 hover:underline">
          {t("compare")}
        </summary>
        <div className="mt-2">
          <PlanTable highlight={current === "trial" ? "growth" : current} />
        </div>
      </details>
    </div>
  );
}
