import { getTranslations } from "next-intl/server";
import { QrScanner } from "@/components/staff/qr-scanner";
import { requireStaff } from "@/server/auth/require-staff";

export default async function ScanPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requireStaff();
  const [t, { error }] = await Promise.all([getTranslations("staff.scan"), searchParams]);
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-extrabold">{t("title")}</h1>
        <p className="text-muted">{t("body")}</p>
      </div>
      <QrScanner initialError={error} />
    </div>
  );
}
