import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { HeroDemo } from "@/components/landing/hero-demo";
import { GoogleButton } from "@/components/auth/google-button";
import { Button } from "@/components/ui";
import type { LandingSector } from "@/domain/business-types";

/** Portada. En las páginas de sector se bloquea el sector y se cambian el titular y el subtítulo. */
export async function Hero({
  sector,
  title,
  subtitle,
  eyebrow,
}: {
  sector?: LandingSector;
  title?: string;
  subtitle?: string;
  eyebrow?: string;
}) {
  const t = await getTranslations("landing.hero");
  return (
    <section id="inicio" className="hero-mesh overflow-hidden">
      <div className="mx-auto grid max-w-6xl items-center gap-16 px-4 pt-12 pb-28 md:grid-cols-[1.05fr_0.95fr] md:pt-20 md:pb-32">
        <div className="flex flex-col items-start gap-6">
          <p className="bg-surface text-wine-800 ring-cream-100 rounded-full px-3.5 py-1.5 text-sm font-semibold shadow-sm ring-1">
            {eyebrow ?? t("eyebrow")}
          </p>
          <h1 className="text-5xl font-extrabold text-balance sm:text-6xl md:text-7xl md:leading-[1.02]">
            {title ?? (
              <>
                {t("titleA")}{" "}
                <span className="relative inline-block text-red-500">
                  {t("titleB")}
                  <svg
                    aria-hidden
                    viewBox="0 0 200 12"
                    preserveAspectRatio="none"
                    className="absolute -bottom-1 left-0 h-3 w-full"
                  >
                    <path
                      d="M2 8 Q 25 2 50 7 T 100 7 T 150 7 T 198 6"
                      stroke="var(--cream-200)"
                      strokeWidth="5"
                      fill="none"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                .
              </>
            )}
          </h1>
          <p className="text-muted max-w-xl text-lg text-pretty md:text-xl">{subtitle ?? t("subtitle")}</p>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <Button asChild size="lg">
              <Link href="/registro">
                {t("cta")}
                <ArrowRight aria-hidden />
              </Link>
            </Button>
            <GoogleButton next="/app/empezar" label={t("google")} block={false} />
            <Button asChild size="lg" variant="secondary">
              <Link href="/#como-funciona">{t("demo")}</Link>
            </Button>
          </div>
          <p className="text-muted text-sm">{t("note")}</p>
        </div>
        <HeroDemo initial={sector ?? "cafeteria"} locked={!!sector} />
      </div>
    </section>
  );
}
