"use client";

import { Stamp } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui";
import { registerVisitAction } from "@/server/actions/staff";
import { useStaffAction } from "./use-staff-action";

export function RegisterVisit({ customerId, customerName }: { customerId: string; customerName: string }) {
  const t = useTranslations("staff.customer");
  const { pending, run } = useStaffAction();

  return (
    <div className="flex flex-col gap-3">
      <Button
        size="lg"
        block
        className="min-h-16 text-xl"
        loading={pending}
        onClick={() =>
          // Clave nueva por toque: un doble toque accidental reutiliza la misma petición en vuelo
          run(
            () => registerVisitAction(customerId, crypto.randomUUID()),
            (r) =>
              r.data.rewards_issued
                ? t("rewardIssued", { name: customerName })
                : t("visitDone", { count: r.data.balance, total: r.data.stamps_required }),
          )
        }
      >
        <Stamp aria-hidden className="size-6!" />
        {t("registerVisit")}
      </Button>
    </div>
  );
}
