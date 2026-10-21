import { notFound } from "next/navigation";
import type { CSSProperties } from "react";
import { getCustomerFromSession } from "@/server/auth/customer-session";
import { getLocationBySlug } from "@/server/repositories/locations";
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
  const style = location.brandColor ? ({ "--brand": location.brandColor } as CSSProperties) : undefined;

  return (
    <div style={style} className="mx-auto flex min-h-dvh max-w-md flex-col">
      <header className="flex items-center gap-3 px-4 pt-5 pb-3">
        <span
          aria-hidden
          className="bg-brand font-display flex size-10 items-center justify-center rounded-full text-lg font-extrabold text-white"
        >
          {location.name.charAt(0)}
        </span>
        <p className="font-display text-lg font-bold">{location.name}</p>
      </header>
      <main className={customer ? "flex-1 px-4 pb-28" : "flex-1 px-4 pb-10"}>{children}</main>
      {customer && <BottomNav slug={slug} />}
      <RegisterServiceWorker />
    </div>
  );
}
