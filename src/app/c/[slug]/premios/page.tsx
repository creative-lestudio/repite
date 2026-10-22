import { Gift } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import { env } from "@/lib/env";
import { firstName } from "@/domain/templates";
import { EmptyState } from "@/components/ui";
import { RedeemButton } from "@/components/customer/redeem-button";
import { requireCustomer } from "@/server/auth/require-customer";
import { getCardState } from "@/server/repositories/customers";
import { qrSvg } from "@/server/qr";

export default async function RewardsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { location, customer } = await requireCustomer(slug);
  const [t, format, state, svg] = await Promise.all([
    getTranslations("customer.rewards"),
    getFormatter(),
    getCardState(customer.id, location.id),
    qrSvg(`${env().NEXT_PUBLIC_APP_URL}/equipo/q/${customer.qr_token}`),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold">{t("title")}</h1>
      {state.rewards.length === 0 ? (
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
      ) : (
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
