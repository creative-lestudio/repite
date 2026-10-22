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
  SectorsSection,
  WhoSection,
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
          { "@type": "Offer", name: "Gratis", price: "0", priceCurrency: "EUR", description: "Hasta 50 clientes" },
          {
            "@type": "Offer",
            name: "Pro",
            price: "19",
            priceCurrency: "EUR",
            description: "Clientes sin límite, 30 días de prueba",
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
        <HowSection />
        <WalletSection />
        <SectorsSection />
        <FeaturesSection />
        <WhoSection />
        <PreviewSection />
        <BrandSection />
        <PricingSection />
        <FaqSection />
        <FinalCta />
      </main>
      <SiteFooter />
      <StickyCta />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
