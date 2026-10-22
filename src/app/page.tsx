import {
  ArrowRight,
  Brain,
  Check,
  FileText,
  Notebook,
  QrCode,
  ShieldCheck,
  Stamp,
  UserRoundCheck,
  Users,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { getMessages, getTranslations } from "next-intl/server";
import { HeroPhone } from "@/components/landing/hero-phone";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { Button } from "@/components/ui";
import { formatPrice } from "@/config/plan";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("landing.hero");
  return {
    title: { absolute: "Repite · Tarjeta de sellos y fidelización para cafeterías" },
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

type Item = { title: string; body: string };
const featureIcons = [Stamp, Notebook, Brain, ShieldCheck, UserRoundCheck, QrCode];

export default async function LandingPage() {
  const [t, th, ts, tp, tf, tq, tw, tv] = await Promise.all([
    getTranslations("landing.hero"),
    getTranslations("landing.how"),
    getTranslations("landing.features"),
    getTranslations("landing.pricing"),
    getTranslations("landing.final"),
    getTranslations("landing.faq"),
    getTranslations("landing.who"),
    getTranslations("landing.preview"),
  ]);
  const { landing } = await getMessages();
  const strip = Object.values(landing.strip);
  const steps: Item[] = Object.values(landing.how.steps);
  const features: Item[] = Object.values(landing.features.items);
  const who = Object.values(landing.who.items);
  const planFeatures = Object.values(landing.pricing.features);
  const faq = Object.values(landing.faq.items);
  const whoIcons = [Users, Stamp, Notebook];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "SoftwareApplication",
        name: "Repite",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        offers: { "@type": "Offer", price: "0", priceCurrency: "EUR", description: "30 días de prueba gratuita" },
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
        {/* Portada */}
        <section className="overflow-hidden pb-6">
          <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 pt-12 pb-20 md:grid-cols-[1.1fr_0.9fr] md:pt-20 md:pb-28">
            <div className="flex flex-col items-start gap-6">
              <p className="bg-primary-soft rounded-full px-3 py-1 text-sm font-semibold text-blue-800">
                {t("eyebrow")}
              </p>
              <h1 className="text-4xl font-extrabold text-balance sm:text-5xl md:text-6xl md:leading-[1.05]">
                {t("title")}
              </h1>
              <p className="text-muted max-w-xl text-lg text-pretty">{t("subtitle")}</p>
              <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
                <Button asChild size="lg">
                  <Link href="/registro">
                    {t("cta")}
                    <ArrowRight aria-hidden />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="secondary">
                  <Link href="/c/cafe-aurora">{t("demo")}</Link>
                </Button>
              </div>
              <p className="text-muted text-sm">{t("note")}</p>
            </div>
            <HeroPhone />
          </div>
        </section>

        {/* Tira de promesas */}
        <section aria-label="Resumen" className="border-y border-blue-100 bg-white">
          <ul className="mx-auto grid max-w-6xl grid-cols-2 gap-x-4 gap-y-3 px-4 py-6 md:grid-cols-4">
            {strip.map((s) => (
              <li key={s} className="flex items-center gap-2 text-sm font-semibold">
                <Check className="text-primary size-5 shrink-0" aria-hidden />
                {s}
              </li>
            ))}
          </ul>
        </section>

        {/* Cómo funciona */}
        <section id="como-funciona" aria-labelledby="how-title" className="scroll-mt-16 px-4 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <h2 id="how-title" className="text-3xl font-extrabold sm:text-4xl">
                {th("title")}
              </h2>
              <p className="text-muted mt-3 text-lg">{th("subtitle")}</p>
            </div>
            <ol className="mt-12 grid gap-6 md:grid-cols-3">
              {steps.map((s, i) => (
                <li
                  key={s.title}
                  className="bg-surface shadow-card relative flex flex-col gap-3 rounded-xl p-6 ring-1 ring-blue-100"
                >
                  <span className="bg-primary font-display flex size-11 items-center justify-center rounded-full text-lg font-extrabold text-white">
                    {i + 1}
                  </span>
                  <h3 className="text-xl font-bold">{s.title}</h3>
                  <p className="text-muted">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Ventajas */}
        <section id="ventajas" aria-labelledby="features-title" className="scroll-mt-16 bg-white px-4 py-20">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <h2 id="features-title" className="text-3xl font-extrabold sm:text-4xl">
                {ts("title")}
              </h2>
              <p className="text-muted mt-3 text-lg">{ts("subtitle")}</p>
            </div>
            <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((f, i) => {
                const Icon = featureIcons[i] ?? FileText;
                return (
                  <li key={f.title} className="flex flex-col gap-3 rounded-xl bg-blue-50 p-6">
                    <span className="bg-surface text-primary flex size-12 items-center justify-center rounded-lg ring-1 ring-blue-100">
                      <Icon className="size-6" aria-hidden />
                    </span>
                    <h3 className="text-lg font-bold">{f.title}</h3>
                    <p className="text-muted">{f.body}</p>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* Para quién */}
        <section aria-labelledby="who-title" className="px-4 py-20">
          <div className="mx-auto max-w-6xl">
            <h2
              id="who-title"
              className="mx-auto max-w-2xl text-center text-3xl font-extrabold text-balance sm:text-4xl"
            >
              {tw("title")}
            </h2>
            <ul className="mt-12 grid gap-6 md:grid-cols-3">
              {who.map((w, i) => {
                const Icon = whoIcons[i] ?? Users;
                return (
                  <li key={w.who} className="flex gap-4">
                    <span className="bg-primary-soft text-primary flex size-12 shrink-0 items-center justify-center rounded-full">
                      <Icon className="size-6" aria-hidden />
                    </span>
                    <div>
                      <h3 className="font-display text-lg font-bold">{w.who}</h3>
                      <p className="text-muted mt-1">{w.body}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        {/* Vista previa del producto */}
        <section aria-labelledby="preview-title" className="bg-blue-950 px-4 py-20 text-white">
          <div className="mx-auto max-w-6xl">
            <div className="mx-auto max-w-2xl text-center">
              <h2 id="preview-title" className="text-3xl font-extrabold sm:text-4xl">
                {tv("title")}
              </h2>
              <p className="mt-3 text-lg text-blue-200">{tv("subtitle")}</p>
            </div>
            <div className="mt-12 grid items-end gap-6 md:grid-cols-[1fr_16rem]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/landing/panel.webp"
                alt={tv("alt")}
                width={1280}
                height={800}
                loading="lazy"
                className="w-full rounded-xl shadow-2xl ring-1 ring-white/10"
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/landing/tarjeta.webp"
                alt={tv("altPhone")}
                width={390}
                height={780}
                loading="lazy"
                className="mx-auto hidden w-64 rounded-[2rem] shadow-2xl ring-1 ring-white/10 md:block"
              />
            </div>
          </div>
        </section>

        {/* Precio */}
        <section id="precio" aria-labelledby="pricing-title" className="scroll-mt-16 px-4 py-20">
          <div className="mx-auto max-w-3xl">
            <div className="text-center">
              <h2 id="pricing-title" className="text-3xl font-extrabold sm:text-4xl">
                {tp("title")}
              </h2>
              <p className="text-muted mt-3 text-lg">{tp("subtitle")}</p>
            </div>
            <div className="bg-surface shadow-card mx-auto mt-10 flex max-w-md flex-col gap-5 rounded-xl p-8 ring-2 ring-blue-600">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-display text-2xl font-extrabold">{tp("name")}</h3>
                <span className="bg-primary rounded-full px-3 py-1 text-sm font-bold text-white">{tp("badge")}</span>
              </div>
              <div>
                <p className="font-display text-5xl font-extrabold">
                  {formatPrice("EUR")} <span className="text-muted text-lg font-semibold">{tp("perMonth")}</span>
                </p>
                <p className="text-muted mt-1 text-sm">
                  {tp("priceNote", { eur: formatPrice("EUR"), usd: formatPrice("USD") })}
                </p>
              </div>
              <ul className="flex flex-col gap-3">
                {planFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="text-success mt-0.5 size-5 shrink-0" aria-hidden />
                    {f}
                  </li>
                ))}
              </ul>
              <Button asChild size="lg" block>
                <Link href="/registro">{tp("cta")}</Link>
              </Button>
              <p className="text-muted text-center text-sm">{tp("note")}</p>
            </div>
          </div>
        </section>

        {/* Preguntas */}
        <section id="preguntas" aria-labelledby="faq-title" className="scroll-mt-16 bg-white px-4 py-20">
          <div className="mx-auto max-w-3xl">
            <h2 id="faq-title" className="text-center text-3xl font-extrabold sm:text-4xl">
              {tq("title")}
            </h2>
            <div className="mt-10 flex flex-col gap-3">
              {faq.map((f) => (
                <details key={f.q} className="group rounded-xl bg-blue-50 px-5 py-1 open:bg-blue-100/60">
                  <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 font-bold [&::-webkit-details-marker]:hidden">
                    {f.q}
                    <span
                      aria-hidden
                      className="text-primary text-2xl leading-none transition-transform group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="text-muted pb-4">{f.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Llamada final */}
        <section aria-labelledby="final-title" className="bg-primary px-4 py-20 text-white">
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-5 text-center">
            <h2 id="final-title" className="text-3xl font-extrabold text-balance sm:text-4xl">
              {tf("title")}
            </h2>
            <p className="text-lg text-blue-100">{tf("subtitle")}</p>
            <Button asChild size="lg" className="bg-white text-blue-800 hover:bg-blue-100">
              <Link href="/registro">
                {tf("cta")}
                <ArrowRight aria-hidden />
              </Link>
            </Button>
          </div>
        </section>
      </main>
      <SiteFooter />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
    </>
  );
}
