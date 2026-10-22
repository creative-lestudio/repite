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
  PricingSection,
  PromiseStrip,
  SectorsSection,
  WhoSection,
} from "@/components/landing/sections";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("landing.hero");
  return {
    title: { absolute: "Repite · Tarjeta de sellos y fidelización para tu local" },
    description: t("subtitle"),
    alternates: { canonical: "/" },
    openGraph: {
      title: "Repite · Que tus clientes vuelvan",
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
      <a
        href="#contenido"
        className="bg-primary sr-only z-50 rounded-lg px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Saltar al contenido
      </a>
      <SiteHeader />
      <main id="contenido">
        <Hero />
        <PromiseStrip />
        <HowSection />
        <SectorsSection />
        <FeaturesSection />
        <WhoSection />
        <PreviewSection />
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
