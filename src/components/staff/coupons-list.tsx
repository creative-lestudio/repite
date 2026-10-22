"use client";

import { Ticket } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui";
import { redeemCouponAction } from "@/server/actions/staff";
import { useStaffAction } from "./use-staff-action";

export function CouponsList({ coupons }: { coupons: { id: string; title: string; description: string | null }[] }) {
  const t = useTranslations("staff.customer");
  const tc = useTranslations("common");
  const { pending, run } = useStaffAction();
  const [confirming, setConfirming] = useState<string | null>(null);

  return (
    <section
      aria-labelledby="coupons"
      className="bg-primary-soft ring-cream-200 flex flex-col gap-3 rounded-xl p-4 ring-1"
    >
      <h2 id="coupons" className="flex items-center gap-2 font-bold">
        <Ticket className="text-primary size-5" aria-hidden />
        {t("couponsTitle")}
      </h2>
      <ul className="flex flex-col gap-2">
        {coupons.map((c) => (
          <li key={c.id} className="bg-surface flex flex-wrap items-center justify-between gap-3 rounded-lg p-3">
            <span>
              <span className="block font-semibold">{c.title}</span>
              {c.description && <span className="text-muted block text-sm">{c.description}</span>}
            </span>
            {confirming === c.id ? (
              <span className="flex flex-wrap items-center gap-2">
                <span className="text-sm">{t("couponConfirm", { coupon: c.title })}</span>
                <Button
                  size="sm"
                  loading={pending}
                  onClick={() =>
                    run(
                      () => redeemCouponAction(c.id),
                      () => t("couponDone"),
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
              <Button size="sm" onClick={() => setConfirming(c.id)}>
                {t("redeemCoupon")}
              </Button>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
