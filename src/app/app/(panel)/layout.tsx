import { BrandTheme } from "@/components/brand-theme";
import { Button } from "@/components/ui";
import { brandAssets } from "@/server/brand-assets";
import { OwnerNav } from "@/components/owner/owner-nav";
import { Toaster } from "@/components/staff/toaster";
import { signOutOwnerAction } from "@/server/actions/auth";
import { requireOwner } from "@/server/auth/owner";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";
export const metadata = { title: "Panel", robots: { index: false } };

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  const ctx = await requireOwner();
  const t = await getTranslations("auth");
  return (
    <Toaster>
      <BrandTheme brand={ctx.location.brand} className="flex min-h-dvh flex-col md:flex-row">
        <OwnerNav
          locationName={ctx.location.name}
          slug={ctx.location.slug}
          logoUrl={brandAssets(ctx.location.brand).logoUrl}
          email={ctx.email}
          signOut={
            <form action={signOutOwnerAction}>
              <Button type="submit" variant="secondary" size="sm" block>
                {t("signOut")}
              </Button>
            </form>
          }
        />
        <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 md:px-8 md:py-8">{children}</main>
      </BrandTheme>
    </Toaster>
  );
}
