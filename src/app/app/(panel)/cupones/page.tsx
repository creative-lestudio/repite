import { getTranslations } from "next-intl/server";
import { CouponForm, CouponItem, LockedNote } from "@/components/owner/coupons-panel";
import { Card } from "@/components/ui";
import { planSpec } from "@/domain/plan";
import { requireManager } from "@/server/auth/owner";
import { listCoupons } from "@/server/repositories/owner";

export const metadata = { title: "Cupones" };

export default async function CouponsPage() {
  const ctx = await requireManager();
  const [t, coupons] = await Promise.all([getTranslations("owner.coupons"), listCoupons()]);
  const limit = planSpec(ctx.organization.effectivePlan).coupons;

  return (
    <div className="flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold">{t("pageTitle")}</h1>
        <p className="text-muted mt-1">{t("intro")}</p>
      </div>
      {limit === 0 && <LockedNote />}
      {limit === 1 && <p className="text-muted text-sm">{t("limitBasic")}</p>}
      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-bold">{t("newTitle")}</h2>
        <CouponForm locked={limit === 0} />
      </Card>
      {coupons.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">{t("listTitle")}</h2>
          <ul className="flex flex-col gap-3">
            {coupons.map((c) => (
              <CouponItem key={c.id} coupon={c} />
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
