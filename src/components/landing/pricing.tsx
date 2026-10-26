"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { PlanCards } from "@/components/plans/plan-cards";
import { PlanTable } from "@/components/plans/plan-table";
import { Estimator } from "@/components/landing/estimator";
import { Button } from "@/components/ui";
import { CONTACT_EMAIL } from "@/config/contact";

export function Pricing() {
  const t = useTranslations("landing.pricing");
  const tp = useTranslations("plans");
  const ticket = 7;

  return (
    <section id="precio" aria-labelledby="pricing-title" className="scroll-mt-16 px-4 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          <h2 id="pricing-title" className="text-3xl font-extrabold md:text-5xl">
            {t("title")}
          </h2>
          <p className="text-muted mt-3 text-lg">{t("subtitle")}</p>
        </div>

        <div className="mt-10">
          <PlanCards
            ticket={ticket}
            renderCta={(plan) => (
              <Button asChild size="lg" variant={plan === "starter" ? "primary" : "secondary"} block>
                <Link href="/registro">{plan === "starter" ? t("ctaFree") : t("ctaTrial")}</Link>
              </Button>
            )}
            renderRedCta={() => (
              <Button asChild size="lg" variant="secondary" block>
                <a href={`mailto:${CONTACT_EMAIL}`}>{tp("requestInfo")}</a>
              </Button>
            )}
          />
        </div>
        <p className="text-muted mx-auto mt-6 max-w-2xl text-center text-sm">
          <span className="text-primary font-semibold">{t("badge")}.</span> {t("trialNote")}
        </p>

        <Estimator />

        <details className="group mt-10">
          <summary className="text-primary mx-auto min-h-11 w-fit cursor-pointer py-3 text-center font-semibold underline-offset-4 hover:underline">
            {t("compare")}
          </summary>
          <div className="mt-4">
            <PlanTable highlight="growth" />
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
