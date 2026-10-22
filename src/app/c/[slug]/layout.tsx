import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCustomerFromSession } from "@/server/auth/customer-session";
import { getLocationBySlug } from "@/server/repositories/locations";
import { BrandLogo } from "@/components/brand-logo";
import { BrandTheme } from "@/components/brand-theme";
import { cn } from "@/lib/utils";
import { planSpec } from "@/domain/plan";
import { brandAssets } from "@/server/brand-assets";
import { BottomNav } from "@/components/customer/bottom-nav";
import { RegisterServiceWorker } from "@/components/customer/register-sw";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const location = await getLocationBySlug((await params).slug);
  return { title: location?.name ?? "Repite", robots: { index: false } };
}

export default async function CustomerLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const location = await getLocationBySlug(slug);
  if (!location) notFound();
  const customer = await getCustomerFromSession(location.organizationId);
  const assets = brandAssets(location.brand);
  const tc = await getTranslations("customer");
  const badge = planSpec(location.plan).poweredBy;

  return (
    <BrandTheme brand={location.brand} className="mx-auto flex min-h-dvh max-w-md flex-col">
      <header className="flex items-center gap-3 px-4 pt-5 pb-3">
        <BrandLogo url={assets.logoUrl} name={location.name} />
        <p className="font-display text-lg font-bold">{location.name}</p>
      </header>
      <main className={cn("flex-1 px-4", badge ? "pb-6" : customer ? "pb-28" : "pb-10")}>{children}</main>
      {badge && (
        <p
          className={
            customer ? "text-muted px-4 pb-24 text-center text-xs" : "text-muted px-4 pb-8 text-center text-xs"
          }
        >
          <Link href="/?ref=tarjeta" className="underline underline-offset-4">
            {tc("poweredBy")}
          </Link>
        </p>
      )}
      {customer && <BottomNav slug={slug} showExtra={planSpec(location.plan).bonuses} />}
      <RegisterServiceWorker />
    </BrandTheme>
  );
}
