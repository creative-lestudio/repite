import { ArrowLeft, BellOff, Sparkles } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { Badge } from "@/components/ui";
import { StampCard } from "@/components/stamp-card/stamp-card";
import { BonusReview } from "@/components/staff/bonus-review";
import { Notes } from "@/components/staff/notes";
import { RegisterVisit } from "@/components/staff/register-visit";
import { RewardsList } from "@/components/staff/rewards-list";
import { UsualOrder } from "@/components/staff/usual-order";
import { uuid } from "@/lib/schemas/staff";
import { firstName } from "@/domain/templates";
import { maskPhone } from "@/domain/phone";
import { requireStaff } from "@/server/auth/require-staff";
import { getCardState, getCustomer } from "@/server/repositories/customers";
import { getCustomerNotes, getPendingBonuses } from "@/server/repositories/staff";

export default async function StaffCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireStaff();
  const { id } = await params;
  if (!uuid.safeParse(id).success) notFound();
  const { organizationId, location } = {
    organizationId: session.device.organizationId,
    location: session.device.location,
  };
  const customer = await getCustomer(organizationId, id);
  if (!customer) notFound();

  const [t, format, card, notes, pending] = await Promise.all([
    getTranslations("staff.customer"),
    getFormatter(),
    getCardState(customer.id, location.id),
    getCustomerNotes(organizationId, customer.id),
    getPendingBonuses(location.id),
  ]);
  const myPending = pending.filter((p) => p.customer_id === customer.id);

  return (
    <div className="flex flex-col gap-5">
      <Link
        href="/equipo"
        className="text-primary inline-flex min-h-11 items-center gap-1 self-start text-sm font-semibold"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("back")}
      </Link>

      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold">{customer.name}</h1>
        <p className="text-muted flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
          <span>{maskPhone(customer.phone_e164)}</span>
          <span>
            {customer.last_visit_at
              ? t("lastVisit", {
                  date: format.relativeTime(new Date(customer.last_visit_at), new Date()),
                })
              : t("neverVisited")}
          </span>
          {!customer.marketing_consent && (
            <Badge tone="neutral">
              <BellOff className="size-3" aria-hidden />
              {t("noConsent")}
            </Badge>
          )}
        </p>
      </header>

      <div className="grid gap-5 md:grid-cols-2 md:items-start">
        <div className="flex flex-col gap-5">
          {card.program && (
            <StampCard
              total={card.program.stamps_required}
              filled={card.balance}
              rewardName={card.program.reward_name}
              sector={location.businessType}
            />
          )}
          <RegisterVisit customerId={customer.id} customerName={firstName(customer.name)} />
        </div>

        <div className="flex flex-col gap-5">
          {card.rewards.length > 0 && <RewardsList rewards={card.rewards} />}

          {myPending.length > 0 && (
            <section
              aria-labelledby="bonus"
              className="bg-warning/8 ring-warning/30 flex flex-col gap-3 rounded-xl p-4 ring-1"
            >
              <h2 id="bonus" className="flex items-center gap-2 font-bold">
                <Sparkles className="text-warning size-5" aria-hidden />
                {t("bonusTitle")}
              </h2>
              <ul className="flex flex-col gap-2">
                {myPending.map((b) => (
                  <BonusReview key={b.event_id} bonus={b} />
                ))}
              </ul>
            </section>
          )}

          <div className="bg-surface rounded-xl p-4 ring-1 ring-blue-100">
            <UsualOrder customerId={customer.id} value={customer.usual_order} />
          </div>

          <Notes customerId={customer.id} notes={notes} />
        </div>
      </div>
    </div>
  );
}
