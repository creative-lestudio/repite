import { Tablet } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { EmptyState } from "@/components/ui";
import { StaffHeader } from "@/components/staff/staff-header";
import { StaffNav } from "@/components/staff/staff-nav";
import { StaffSignIn } from "@/components/staff/staff-sign-in";
import { Toaster } from "@/components/staff/toaster";
import { getDevice, getStaffSession, listStaffForDevice } from "@/server/auth/staff-session";
import { getPendingBonuses } from "@/server/repositories/staff";

export const dynamic = "force-dynamic";
export const metadata = { title: "Equipo", robots: { index: false } };

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("staff");
  const device = await getDevice();

  if (!device) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-lg flex-col justify-center px-4 py-10">
        <EmptyState
          icon={<Tablet />}
          title={t("pairing.title")}
          description={
            <>
              {t("pairing.body")} {t("pairing.steps")}
            </>
          }
        />
      </main>
    );
  }

  const session = await getStaffSession();
  if (!session) {
    const staff = await listStaffForDevice(device);
    return (
      <main className="mx-auto flex min-h-dvh max-w-lg flex-col px-4 py-8">
        <p className="text-muted text-sm font-semibold">{device.location.name}</p>
        <StaffSignIn staff={staff} />
      </main>
    );
  }

  const pending = await getPendingBonuses(device.location.id);
  return (
    <Toaster>
      <div className="mx-auto flex min-h-dvh max-w-3xl flex-col">
        <StaffHeader locationName={device.location.name} staffName={session.staffName} />
        <main className="flex-1 px-4 pt-4 pb-28">{children}</main>
        <StaffNav pendingCount={pending.length} />
      </div>
    </Toaster>
  );
}
