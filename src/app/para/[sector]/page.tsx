import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import { getMessages, getTranslations } from "next-intl/server";
import { Hero } from "@/components/landing/hero";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { StickyCta } from "@/components/landing/sticky-cta";
import { FaqSection, FinalCta, HowSection, PricingSection, SectionTitle } from "@/components/landing/sections";
import { LANDING_SECTORS, SECTOR_SLUGS, sectorFromSlug } from "@/domain/business-types";

export function generateStaticParams() {
  return LANDING_SECTORS.map((s) => ({ sector: SECTOR_SLUGS[s] }));
}

export async function generateMetadata({ params }: { params: Promise<{ sector: string }> }): Promise<Metadata> {
  const sector = sectorFromSlug((await params).sector);
  if (!sector) return {};
  const t = await getTranslations("sectors");
  return {
    title: t(`${sector}.page.title`),
    description: t(`${sector}.page.description`),
    alternates: { canonical: `/para/${SECTOR_SLUGS[sector]}` },
    openGraph: {
      title: t(`${sector}.page.title`),
      description: t(`${sector}.page.description`),
      type: "website",
      siteName: "Repite",
    },
  };
}

export default async function SectorPage({ params }: { params: Promise<{ sector: string }> }) {
  const sector = sectorFromSlug((await params).sector);
  if (!sector) notFound();
  const [t, ts, messages] = await Promise.all([
    getTranslations("landing.sectorPage"),
    getTranslations("sectors"),
    getMessages(),
  ]);
  const benefits = Object.values(messages.sectors[sector].benefits);
  const rewards = Object.values(messages.sectors[sector].rewards);

  return (
    <>
      <SiteHeader />
      <main id="contenido">
        <Hero
          sector={sector}
          eyebrow={ts(`${sector}.plural`)}
          title={ts(`${sector}.page.title`)}
          subtitle={ts(`${sector}.hook`)}
        />

        <section aria-labelledby="benefits-title" className="px-4 py-20 md:py-28">
          <div className="mx-auto max-w-6xl">
            <SectionTitle id="benefits-title" title={t("benefits")} />
            <ul className="mt-12 grid gap-6 md:grid-cols-3">
              {benefits.map((b) => (
                <li
                  key={b.title}
                  className="bg-surface shadow-card flex flex-col gap-2 rounded-2xl p-7 ring-1 ring-blue-100"
                >
                  <h3 className="text-xl font-bold">{b.title}</h3>
                  <p className="text-muted">{b.body}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <HowSection />

        <section aria-labelledby="rewards-title" className="bg-white px-4 py-20 md:py-28">
          <div className="mx-auto max-w-3xl">
            <SectionTitle id="rewards-title" title={t("rewards")} subtitle={t("rewardsSubtitle")} />
            <ul className="mt-10 grid gap-3 sm:grid-cols-2">
              {rewards.map((r) => (
                <li key={r} className="flex items-center gap-3 rounded-xl bg-blue-50 p-4 font-semibold">
                  <Check className="text-success size-5 shrink-0" aria-hidden />
                  {r}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <PricingSection />
        <FaqSection />
        <FinalCta />
        <p className="px-4 pb-10 text-center">
          <Link href="/#negocios" className="text-primary text-sm font-semibold underline-offset-4 hover:underline">
            {t("back")}
          </Link>
        </p>
      </main>
      <SiteFooter />
      <StickyCta />
    </>
  );
}
