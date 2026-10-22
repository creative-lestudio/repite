import { notFound } from "next/navigation";
import { getCustomerFromSession } from "@/server/auth/customer-session";
import { getLocationBySlug } from "@/server/repositories/locations";
import { BrandLogo } from "@/components/brand-logo";
import { BrandTheme } from "@/components/brand-theme";
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

  return (
    <BrandTheme brand={location.brand} className="mx-auto flex min-h-dvh max-w-md flex-col">
      <header className="flex items-center gap-3 px-4 pt-5 pb-3">
        <BrandLogo url={assets.logoUrl} name={location.name} />
        <p className="font-display text-lg font-bold">{location.name}</p>
      </header>
      <main className={customer ? "flex-1 px-4 pb-28" : "flex-1 px-4 pb-10"}>{children}</main>
      {customer && <BottomNav slug={slug} />}
      <RegisterServiceWorker />
    </BrandTheme>
  );
}
