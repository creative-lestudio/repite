import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { DemoCard } from "@/components/landing/demo-card";
import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/landing/site-header";
import { Button } from "@/components/ui";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("landing.demo");
  return { title: t("metaTitle"), description: t("intro"), alternates: { canonical: "/demo" } };
}

export default async function DemoPage() {
  const t = await getTranslations("landing.demo");
  return (
    <>
      <SiteHeader />
      <main id="contenido" className="px-4 py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-extrabold text-balance md:text-5xl">{t("title")}</h1>
          <p className="text-muted mt-3 text-lg text-pretty">{t("intro")}</p>
        </div>
        <div className="mt-10">
          <DemoCard />
        </div>
        <div className="mt-10 flex justify-center">
          <Button asChild size="lg">
            <Link href="/registro">{t("cta")}</Link>
          </Button>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
