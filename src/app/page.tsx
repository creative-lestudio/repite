import type { Metadata } from "next";
import { getMessages, getTranslations } from "next-intl/server";
import { Hero } from "@/components/landing/hero";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { StickyCta } from "@/components/landing/sticky-cta";
import {
  FaqSection,
  FeaturesSection,
  FinalCta,
  HowSection,
  PreviewSection,
  BrandSection,
  PricingSection,
  PromiseStrip,
  ProblemsSection,
  ValueSection,
  TrustSection,
  SectorsSection,
  WalletSection,
} from "@/components/landing/sections";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("landing.hero");
  return {
    title: { absolute: "Repite · Sistema de fidelización para tu negocio" },
    description: t("subtitle"),
    alternates: { canonical: "/" },
    openGraph: {
      title: "Repite · Hacemos que tus clientes vuelvan",
      description: t("subtitle"),
      type: "website",
      locale: "es_ES",
      siteName: "Repite",
    },
  };
}

export default async function LandingPage() {
  const { landing } = await getMessages();
  const faq = Object.values(landing.faq.items);
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: "Repite",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        offers: [
          { "@type": "Offer", name: "Starter", price: "0", priceCurrency: "EUR", description: "Hasta 50 clientes" },
          {
            "@type": "Offer",
            name: "Esencial",
            price: "25",
            priceCurrency: "EUR",
            description: "Al mes, IVA no incluido",
          },
          {
            "@type": "Offer",
            name: "Growth",
            price: "49",
            priceCurrency: "EUR",
            description: "Al mes, IVA no incluido",
          },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: faq.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      },
    ],
  };

  return (
    <>
      <SiteHeader />
      <main id="contenido">
        <Hero />
        <PromiseStrip />
        <ProblemsSection />
        <HowSection />
        <ValueSection />
        <FeaturesSection />
        <PreviewSection />
        <SectorsSection />
        <BrandSection />
        <PricingSection />
        <WalletSection />
        <TrustSection />
        <FaqSection />
        <FinalCta />
      </main>
      <SiteFooter />
      <StickyCta />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
