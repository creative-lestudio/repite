import { getTranslations } from "next-intl/server";
import { UserRoundCog } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { Button } from "@/components/ui";
import { signOutStaffAction } from "@/server/actions/staff";

export async function StaffHeader({
  locationName,
  staffName,
  logoUrl,
}: {
  locationName: string;
  staffName: string;
  logoUrl: string | null;
}) {
  const t = await getTranslations("staff.header");
  return (
    <header className="bg-surface border-cream-100 flex items-center justify-between gap-3 border-b px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <BrandLogo url={logoUrl} name={locationName} className="size-9 text-base" />
        <div className="min-w-0">
          <p className="font-display truncate font-bold">{locationName}</p>
          <p className="text-muted truncate text-sm">{t("signedAs", { name: staffName })}</p>
        </div>
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
