"use client";

import { Gift } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Alert, Button } from "@/components/ui";
import { redeemRewardAction } from "@/server/actions/staff";
import { useStaffAction } from "./use-staff-action";

export function RewardsList({ rewards }: { rewards: { id: string; reward_name: string }[] }) {
  const t = useTranslations("staff.customer");
  const tc = useTranslations("common");
  const { pending, feedback, run } = useStaffAction();
  const [confirming, setConfirming] = useState<string | null>(null);

  return (
    <section
      aria-labelledby="rewards"
      className="bg-primary-soft flex flex-col gap-3 rounded-xl p-4 ring-1 ring-blue-200"
    >
      <h2 id="rewards" className="flex items-center gap-2 font-bold">
        <Gift className="text-primary size-5" aria-hidden />
        {t("rewardsTitle")}
      </h2>
      <ul className="flex flex-col gap-2">
        {rewards.map((r) => (
          <li key={r.id} className="bg-surface flex flex-wrap items-center justify-between gap-3 rounded-lg p-3">
            <span className="font-semibold">{r.reward_name}</span>
            {confirming === r.id ? (
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-sm">{t("redeemConfirm", { reward: r.reward_name })}</span>
                <Button
                  size="sm"
                  loading={pending}
                  onClick={() =>
                    run(
                      () => redeemRewardAction(r.id, crypto.randomUUID()),
                      () => t("redeemDone"),
                    )
                  }
                >
                  {t("redeemYes")}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setConfirming(null)}>
                  {tc("cancel")}
                </Button>
              </span>
            ) : (
              <Button size="sm" onClick={() => setConfirming(r.id)}>
                {t("redeem")}
              </Button>
            )}
          </li>
        ))}
      </ul>
      <div aria-live="polite">{feedback && <Alert tone={feedback.tone}>{feedback.text}</Alert>}</div>
    </section>
  );
}
