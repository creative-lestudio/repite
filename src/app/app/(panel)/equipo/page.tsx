import { Users } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/ui";
import { AddStaffForm, DevicesPanel, StaffRow, TeamCard } from "@/components/owner/team-panel";
import { requireManager } from "@/server/auth/owner";
import { listDevices, listStaff } from "@/server/repositories/team";

export default async function TeamPage() {
  const ctx = await requireManager();
  const [t, staff, devices] = await Promise.all([
    getTranslations("owner.team"),
    listStaff(ctx.location.id),
    listDevices(),
  ]);

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-extrabold">{t("title")}</h1>
        <p className="text-muted mt-1">{t("intro")}</p>
      </div>

      <section aria-labelledby="people" className="flex flex-col gap-3">
        <h2 id="people" className="text-xl font-bold">
          {t("staffTitle")}
        </h2>
        {staff.length === 0 ? (
          <EmptyState icon={<Users />} title={t("emptyTitle")} description={t("emptyBody")} />
        ) : (
          <ul className="bg-surface shadow-card divide-cream-100 ring-cream-100 divide-y rounded-xl ring-1">
            {staff.map((m) => (
              <StaffRow key={m.id} member={m} />
            ))}
          </ul>
        )}
        <TeamCard>
          <AddStaffForm />
        </TeamCard>
      </section>

      <section aria-labelledby="tablets" className="flex flex-col gap-3">
        <div>
          <h2 id="tablets" className="text-xl font-bold">
            {t("tabletsTitle")}
          </h2>
          <p className="text-muted text-sm">{t("tabletsIntro")}</p>
        </div>
        <DevicesPanel devices={devices} />
      </section>
    </div>
  );
}
