import { ArrowRight, Brain, Check, Notebook, QrCode, ShieldCheck, Stamp, UserRoundCheck, Users } from "lucide-react";
import Link from "next/link";
import { getMessages, getTranslations } from "next-intl/server";
import { SectorIcon } from "@/components/sector-icon";
import { StampRow } from "@/components/landing/stamp-row";
import { StampCard } from "@/components/stamp-card/stamp-card";
import { Reveal } from "@/components/landing/reveal";
import { Button } from "@/components/ui";
import { LANDING_SECTORS, SECTOR_SLUGS } from "@/domain/business-types";
import { formatPrice } from "@/config/plan";
import { cn } from "@/lib/utils";

type Item = { title: string; body: string };

export function SectionTitle({
  id,
  title,
  subtitle,
  light,
}: {
  id: string;
  title: string;
  subtitle?: string;
  light?: boolean;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <h2 id={id} className="text-3xl font-extrabold text-balance sm:text-4xl md:text-5xl">
        {title}
      </h2>
      {subtitle && <p className={cn("mt-3 text-lg text-pretty", light ? "text-blue-200" : "text-muted")}>{subtitle}</p>}
    </div>
  );
}

export async function PromiseStrip() {
  const { landing } = await getMessages();
  const strip = Object.values(landing.strip);
  return (
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
  );
}

export async function HowSection() {
  const [t, { landing }] = await Promise.all([getTranslations("landing.how"), getMessages()]);
  const steps: Item[] = Object.values(landing.how.steps);
  const v = landing.how.visual;

  const visuals = [
    // 1 · escanea
    <div key="1" className="flex h-full items-center justify-center">
      <div className="bg-surface shadow-card flex flex-col items-center gap-2 rounded-2xl p-4 ring-1 ring-blue-100">
        <QrCode className="size-16 text-blue-950" aria-hidden strokeWidth={1.5} />
        <span className="text-primary text-xs font-bold">{v.qr}</span>
      </div>
    </div>,
    // 2 · PIN
    <div key="2" className="flex h-full flex-col items-center justify-center gap-3">
      <div className="flex gap-2" aria-hidden>
        {[1, 1, 1, 0].map((on, i) => (
          <span
            key={i}
            className={cn("size-3.5 rounded-full border-2", on ? "bg-primary border-primary" : "border-blue-200")}
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-1.5" aria-hidden>
        {["1", "2", "3", "4", "5", "6"].map((d) => (
          <span
            key={d}
            className="bg-surface font-display flex size-8 items-center justify-center rounded-lg text-sm font-bold text-blue-950 ring-1 ring-blue-100"
          >
            {d}
          </span>
        ))}
      </div>
      <span className="text-primary text-xs font-bold">{v.pin}</span>
    </div>,
    // 3 · mensaje
    <div key="3" className="flex h-full flex-col items-center justify-center gap-2 px-3">
      <div className="bg-surface shadow-card w-full max-w-[13rem] rounded-2xl rounded-bl-sm p-3 text-left text-xs ring-1 ring-blue-100">
        <p className="text-muted">{v.hello}</p>
      </div>
      <span className="bg-primary rounded-full px-3 py-1.5 text-xs font-bold text-white">{v.approve}</span>
    </div>,
  ];

  return (
    <section id="como-funciona" aria-labelledby="how-title" className="scroll-mt-16 px-4 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionTitle id="how-title" title={t("title")} subtitle={t("subtitle")} />
        <ol className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title}>
              <Reveal
                delay={i * 120}
                className="bg-surface shadow-card flex h-full flex-col overflow-hidden rounded-2xl ring-1 ring-blue-100"
              >
                <div className="h-44 border-b border-blue-100 bg-blue-50">{visuals[i]}</div>
                <div className="flex flex-1 flex-col gap-2 p-6">
                  <span className="bg-primary font-display flex size-9 items-center justify-center rounded-full text-base font-extrabold text-white">
                    {i + 1}
                  </span>
                  <h3 className="text-xl font-bold">{s.title}</h3>
                  <p className="text-muted">{s.body}</p>
                </div>
              </Reveal>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export async function SectorsSection() {
  const [t, ts] = await Promise.all([getTranslations("landing.sectors"), getTranslations("sectors")]);
  return (
    <section id="negocios" aria-labelledby="sectors-title" className="scroll-mt-16 bg-white px-4 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionTitle id="sectors-title" title={t("title")} subtitle={t("subtitle")} />
        <ul className="mt-14 grid gap-6 md:grid-cols-3">
          {LANDING_SECTORS.map((s, i) => (
            <li key={s}>
              <Reveal delay={i * 120} className="h-full">
                <Link
                  href={`/para/${SECTOR_SLUGS[s]}`}
                  className="group hover:ring-primary flex h-full flex-col gap-4 rounded-2xl bg-blue-50 p-7 ring-1 ring-transparent transition-all hover:-translate-y-1 hover:shadow-lg"
                >
                  <span className="bg-surface text-primary flex size-14 items-center justify-center rounded-2xl ring-1 ring-blue-100">
                    <SectorIcon sector={s} className="size-7" aria-hidden />
                  </span>
                  <h3 className="font-display text-2xl font-extrabold">{ts(`${s}.plural`)}</h3>
                  <p className="text-muted flex-1">{ts(`${s}.hook`)}</p>
                  <p className="text-sm">
                    <span className="text-muted">{t("example")}: </span>
                    <span className="font-semibold">{ts(`${s}.rewardExample`)}</span>
                  </p>
                  <span className="text-primary inline-flex items-center gap-1 text-sm font-bold">
                    {t("learn")}
                    <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
                  </span>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
        <p className="text-muted mx-auto mt-8 max-w-2xl text-center text-pretty">{t("also")}</p>
      </div>
    </section>
  );
}

const featureIcons = [Stamp, Notebook, Brain, ShieldCheck, UserRoundCheck, QrCode];

export async function FeaturesSection() {
  const [t, { landing }] = await Promise.all([getTranslations("landing.features"), getMessages()]);
  const features: Item[] = Object.values(landing.features.items);
  return (
    <section id="ventajas" aria-labelledby="features-title" className="scroll-mt-16 px-4 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionTitle id="features-title" title={t("title")} subtitle={t("subtitle")} />
        <ul className="mt-14 grid gap-5 md:grid-cols-3">
          {features.map((f, i) => {
            const Icon = featureIcons[i] ?? Stamp;
            const featured = i === 0;
            return (
              <li key={f.title} className={cn(featured && "md:col-span-2 md:row-span-2")}>
                <Reveal
                  delay={(i % 3) * 100}
                  className={cn(
                    "flex h-full flex-col gap-4 rounded-2xl p-7",
                    featured ? "bg-blue-950 text-white" : "bg-white ring-1 ring-blue-100",
                  )}
                >
                  <span
                    className={cn(
                      "flex size-12 items-center justify-center rounded-xl",
                      featured ? "bg-white/10 text-white" : "bg-primary-soft text-primary",
                    )}
                  >
                    <Icon className="size-6" aria-hidden />
                  </span>
                  <h3 className={cn("font-bold", featured ? "font-display text-2xl md:text-3xl" : "text-lg")}>
                    {f.title}
                  </h3>
                  <p className={cn(featured ? "max-w-md text-lg text-blue-200" : "text-muted")}>{f.body}</p>
                  {featured && (
                    <div className="mt-auto w-full max-w-sm pt-6">
                      <StampCard total={8} filled={5} newStamp={5} rewardName="Un café gratis" sector="cafeteria" />
                    </div>
                  )}
                </Reveal>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

export async function WhoSection() {
  const [t, { landing }] = await Promise.all([getTranslations("landing.who"), getMessages()]);
  const who = Object.values(landing.who.items);
  const icons = [Users, Stamp, Notebook];
  return (
    <section aria-labelledby="who-title" className="bg-white px-4 py-20 md:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionTitle id="who-title" title={t("title")} />
        <ul className="mt-14 grid gap-8 md:grid-cols-3">
          {who.map((w, i) => {
            const Icon = icons[i] ?? Users;
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
  );
}

export async function PreviewSection() {
  const t = await getTranslations("landing.preview");
  return (
    <section aria-labelledby="preview-title" className="overflow-hidden bg-blue-950 px-4 py-20 text-white md:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionTitle id="preview-title" title={t("title")} subtitle={t("subtitle")} light />
        <div className="mt-14 grid items-end gap-10 md:grid-cols-[1fr_17rem]">
          <figure>
            <div className="overflow-hidden rounded-xl bg-white shadow-2xl ring-1 ring-white/10">
              <div className="flex items-center gap-1.5 border-b border-blue-100 bg-blue-50 px-4 py-2.5" aria-hidden>
                <span className="size-2.5 rounded-full bg-blue-200" />
                <span className="size-2.5 rounded-full bg-blue-200" />
                <span className="size-2.5 rounded-full bg-blue-200" />
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/landing/panel.webp"
                alt={t("alt")}
                width={1600}
                height={900}
                loading="lazy"
                className="w-full"
              />
            </div>
            <figcaption className="mt-3 text-center text-sm text-blue-200">{t("panelCaption")}</figcaption>
          </figure>
          <figure>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/landing/tarjeta.webp"
              alt={t("altPhone")}
              width={390}
              height={780}
              loading="lazy"
              className="mx-auto w-56 rounded-[2rem] shadow-2xl ring-1 ring-white/10 md:w-full"
            />
            <figcaption className="mt-3 text-center text-sm text-blue-200">{t("phoneCaption")}</figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}

export async function PricingSection() {
  const [tp, { landing }] = await Promise.all([getTranslations("landing.pricing"), getMessages()]);
  const freeFeatures = Object.values(landing.pricing.free.features);
  const proFeatures = Object.values(landing.pricing.pro.features);
  const list = (items: string[]) => (
    <ul className="flex flex-1 flex-col gap-3">
      {items.map((f) => (
        <li key={f} className="flex items-start gap-2">
          <Check className="text-success mt-0.5 size-5 shrink-0" aria-hidden />
          {f}
        </li>
      ))}
    </ul>
  );
  return (
    <section id="precio" aria-labelledby="pricing-title" className="scroll-mt-16 px-4 py-20 md:py-28">
      <div className="mx-auto max-w-4xl">
        <SectionTitle id="pricing-title" title={tp("title")} subtitle={tp("subtitle")} />
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="bg-surface shadow-card flex flex-col gap-5 rounded-2xl p-8 ring-1 ring-blue-100">
            <div>
              <h3 className="font-display text-2xl font-extrabold">{tp("free.name")}</h3>
              <p className="text-muted mt-1 text-sm">{tp("free.tagline")}</p>
            </div>
            <p className="font-display text-5xl font-extrabold">
              {tp("free.price")} <span className="text-muted text-lg font-semibold">{tp("forever")}</span>
            </p>
            {list(freeFeatures)}
            <Button asChild size="lg" variant="secondary" block>
              <Link href="/registro">{tp("free.cta")}</Link>
            </Button>
          </div>

          <div className="bg-surface shadow-card flex flex-col gap-5 rounded-2xl p-8 ring-2 ring-blue-600">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-display text-2xl font-extrabold">{tp("pro.name")}</h3>
                <p className="text-muted mt-1 text-sm">{tp("pro.tagline")}</p>
              </div>
              <span className="bg-primary rounded-full px-3 py-1 text-xs font-bold whitespace-nowrap text-white">
                {tp("pro.popular")}
              </span>
            </div>
            <div>
              <p className="font-display text-5xl font-extrabold">
                {formatPrice("EUR")} <span className="text-muted text-lg font-semibold">{tp("perMonth")}</span>
              </p>
              <p className="text-muted mt-1 text-sm">
                {tp("pro.priceNote", { eur: formatPrice("EUR"), usd: formatPrice("USD") })}
              </p>
            </div>
            {list(proFeatures)}
            <Button asChild size="lg" block>
              <Link href="/registro">{tp("pro.cta")}</Link>
            </Button>
          </div>
        </div>
        <p className="text-muted mx-auto mt-6 max-w-xl text-center text-sm">
          <span className="text-primary font-semibold">{tp("badge")}.</span> {tp("trialNote")}
        </p>
      </div>
    </section>
  );
}

export async function FaqSection() {
  const [t, { landing }] = await Promise.all([getTranslations("landing.faq"), getMessages()]);
  const faq = Object.values(landing.faq.items);
  return (
    <section id="preguntas" aria-labelledby="faq-title" className="scroll-mt-16 bg-white px-4 py-20 md:py-28">
      <div className="mx-auto max-w-3xl">
        <SectionTitle id="faq-title" title={t("title")} />
        <div className="mt-12 flex flex-col gap-3">
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
  );
}

export async function FinalCta() {
  const t = await getTranslations("landing.final");
  return (
    <section
      id="final"
      aria-labelledby="final-title"
      className="bg-primary relative overflow-hidden px-4 py-24 text-white"
    >
      <div aria-hidden className="dot-grid absolute inset-0 opacity-20" />
      <div className="relative mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
        <StampRow tone="light" className="justify-center" />
        <h2 id="final-title" className="text-3xl font-extrabold text-balance sm:text-5xl">
          {t("title")}
        </h2>
        <p className="text-lg text-blue-100">{t("subtitle")}</p>
        <Button asChild size="lg" className="bg-white text-blue-800 hover:bg-blue-100">
          <Link href="/registro">
            {t("cta")}
            <ArrowRight aria-hidden />
          </Link>
        </Button>
      </div>
    </section>
  );
}
