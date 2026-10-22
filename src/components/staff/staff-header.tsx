import { getTranslations } from "next-intl/server";
import { UserRoundCog } from "lucide-react";
import { Button } from "@/components/ui";
import { signOutStaffAction } from "@/server/actions/staff";

export async function StaffHeader({ locationName, staffName }: { locationName: string; staffName: string }) {
  const t = await getTranslations("staff.header");
  return (
    <header className="bg-surface flex items-center justify-between gap-3 border-b border-blue-100 px-4 py-3">
      <div className="min-w-0">
        <p className="font-display truncate font-bold">{locationName}</p>
        <p className="text-muted truncate text-sm">{t("signedAs", { name: staffName })}</p>
      </div>
      <form action={signOutStaffAction}>
        <Button type="submit" variant="secondary" size="sm">
          <UserRoundCog aria-hidden />
          {t("switch")}
        </Button>
      </form>
    </header>
  );
}
