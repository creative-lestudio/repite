import { Gift, Ticket } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import { firstName } from "@/domain/templates";
import { EmptyState } from "@/components/ui";
import { RedeemButton } from "@/components/customer/redeem-button";
import { requireCustomer } from "@/server/auth/require-customer";
import { getCardState } from "@/server/repositories/customers";
import { qrSvg } from "@/server/qr";
import { appUrl } from "@/server/app-url";

export default async function RewardsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { location, customer } = await requireCustomer(slug);
  const [t, format, state, svg] = await Promise.all([
    getTranslations("customer.rewards"),
    getFormatter(),
    getCardState(customer.id, location.id, { issueCoupons: true }),
    qrSvg(`${await appUrl()}/equipo/q/${customer.qr_token}`),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold">{t("title")}</h1>
      {state.coupons.length > 0 && (
        <section aria-labelledby="coupons" className="flex flex-col gap-3">
          <h2 id="coupons" className="text-lg font-bold">
            {t("couponsTitle")}
          </h2>
          <ul className="flex flex-col gap-3">
            {state.coupons.map((c) => (
              <li
                key={c.id}
                className="bg-surface shadow-card ring-cream-100 flex items-start gap-3 rounded-xl border-l-4 border-dashed p-5 ring-1"
              >
                <span className="bg-primary-soft text-primary flex size-11 shrink-0 items-center justify-center rounded-full">
                  <Ticket className="size-6" aria-hidden />
                </span>
                <div>
                  <h3 className="text-lg font-bold">{c.title}</h3>
                  {c.description && <p className="text-sm">{c.description}</p>}
                  <p className="text-muted text-sm">
                    {c.expires_at
                      ? t("couponExpires", {
                          date: format.dateTime(new Date(c.expires_at), {
                            dateStyle: "long",
                            timeZone: location.timezone,
                          }),
                        })
                      : t("couponNoExpiry")}
                  </p>
                  <p className="text-primary mt-1 text-sm font-semibold">{t("couponHint")}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
      {state.rewards.length === 0 && state.coupons.length === 0 ? (
        <EmptyState
          icon={<Gift />}
          title={t("emptyTitle")}
          description={
            state.program
              ? t("emptyBody", {
                  count: state.program.stamps_required - state.balance,
                  reward: state.program.reward_name.toLowerCase(),
                })
              : undefined
          }
        />
      ) : state.rewards.length === 0 ? null : (
        <ul className="flex flex-col gap-3">
          {state.rewards.map((r) => (
            <li key={r.id} className="bg-surface shadow-card ring-cream-100 flex flex-col gap-3 rounded-xl p-5 ring-1">
              <div className="flex items-start gap-3">
                <span className="bg-primary-soft text-primary flex size-11 shrink-0 items-center justify-center rounded-full">
                  <Gift className="size-6" aria-hidden />
                </span>
                <div>
                  <h2 className="text-lg font-bold">{r.reward_name}</h2>
                  <p className="text-muted text-sm">
                    {r.expires_at
                      ? t("expires", {
                          date: format.dateTime(new Date(r.expires_at), {
                            dateStyle: "long",
                            timeZone: location.timezone,
                          }),
                        })
                      : t("noExpiry")}
                  </p>
                </div>
              </div>
              <RedeemButton rewardName={r.reward_name} customerName={firstName(customer.name)} qrSvg={svg} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
