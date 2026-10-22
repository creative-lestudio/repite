"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { Alert, Button } from "@/components/ui";
import { validateBonusAction } from "@/server/actions/staff";
import type { PendingBonus } from "@/server/repositories/staff";
import { useStaffAction } from "./use-staff-action";

export function BonusReview({ bonus, showCustomer }: { bonus: PendingBonus; showCustomer?: boolean }) {
  const t = useTranslations("staff.customer");
  const tp = useTranslations("staff.pending");
  const { pending, feedback, run } = useStaffAction();
  const handle = bonus.evidence?.handle;

  return (
    <li className="bg-surface flex flex-col gap-3 rounded-lg p-3 ring-1 ring-blue-100">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex flex-col">
          {showCustomer && <span className="font-semibold">{bonus.customer_name}</span>}
          <span className={showCustomer ? "text-muted text-sm" : "font-semibold"}>{t(bonus.type)}</span>
          {handle && <span className="text-muted text-sm">{tp("handle", { handle })}</span>}
          {bonus.evidence?.note && <span className="text-muted text-sm">{bonus.evidence.note}</span>}
        </div>
        {showCustomer && (
          <Link
            href={`/equipo/clientes/${bonus.customer_id}`}
            className="text-primary min-h-11 py-2 text-sm font-semibold underline-offset-4 hover:underline"
          >
            {tp("openCustomer")}
          </Link>
        )}
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          loading={pending}
          onClick={() =>
            run(
              () => validateBonusAction(bonus.event_id, true),
              () => t("approved"),
            )
          }
        >
          {t("approve")}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          disabled={pending}
          onClick={() =>
            run(
              () => validateBonusAction(bonus.event_id, false),
              () => t("rejected"),
            )
          }
        >
          {t("reject")}
        </Button>
      </div>
      <div aria-live="polite">{feedback && <Alert tone={feedback.tone}>{feedback.text}</Alert>}</div>
    </li>
  );
}
