import { CheckCheck } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/ui";
import { BonusReview } from "@/components/staff/bonus-review";
import { requireStaff } from "@/server/auth/require-staff";
import { getPendingBonuses } from "@/server/repositories/staff";

export default async function PendingPage() {
  const session = await requireStaff();
  const [t, pending] = await Promise.all([
    getTranslations("staff.pending"),
    getPendingBonuses(session.device.location.id),
  ]);
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-extrabold">{t("title")}</h1>
        <p className="text-muted">{t("intro")}</p>
      </div>
      {pending.length === 0 ? (
        <EmptyState icon={<CheckCheck />} title={t("emptyTitle")} description={t("emptyBody")} />
      ) : (
        <ul className="flex flex-col gap-3">
          {pending.map((b) => (
            <BonusReview key={b.event_id} bonus={b} showCustomer />
          ))}
        </ul>
      )}
    </div>
  );
}
