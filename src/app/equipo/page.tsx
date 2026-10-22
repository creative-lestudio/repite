import { CalendarCheck, ScanLine, Sparkles } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button, EmptyState } from "@/components/ui";
import { CustomerSearch } from "@/components/staff/customer-search";
import { DayVisits } from "@/components/staff/day-visits";
import { startOfDayInZone } from "@/domain/time";
import { requireStaff } from "@/server/auth/require-staff";
import { getDayVisits, getPendingBonuses } from "@/server/repositories/staff";

export default async function StaffHome() {
  const session = await requireStaff();
  const location = session.device.location;
  const now = new Date();
  const [t, visits, pending] = await Promise.all([
    getTranslations("staff.home"),
    getDayVisits(location.id, startOfDayInZone(now, location.timezone)),
    getPendingBonuses(location.id),
  ]);
  const active = visits.filter((v) => !v.undone).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-start">
        <CustomerSearch />
        <Button asChild size="lg" className="md:mt-7">
          <Link href="/equipo/escanear">
            <ScanLine aria-hidden />
            {t("scan")}
          </Link>
        </Button>
      </div>

      {pending.length > 0 && (
        <Link
          href="/equipo/pendientes"
          className="bg-warning/8 ring-warning/30 hover:bg-warning/12 flex min-h-14 items-center gap-3 rounded-xl px-4 ring-1"
        >
          <Sparkles className="text-warning size-5 shrink-0" aria-hidden />
          <span className="flex-1 font-semibold">{t("pendingBanner", { count: pending.length })}</span>
          <span className="text-primary text-sm font-semibold underline underline-offset-4">{t("pendingAction")}</span>
        </Link>
      )}

      <section aria-labelledby="today" className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between">
          <h1 id="today" className="text-xl font-extrabold">
            {t("today")}
          </h1>
          <span className="text-muted text-sm">{t("todayCount", { count: active })}</span>
        </div>
        {visits.length === 0 ? (
          <EmptyState icon={<CalendarCheck />} title={t("todayEmptyTitle")} description={t("todayEmptyBody")} />
        ) : (
          <DayVisits visits={visits} timeZone={location.timezone} now={now.getTime()} />
        )}
      </section>
    </div>
  );
}
