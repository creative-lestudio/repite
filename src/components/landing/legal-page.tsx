import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Alert } from "@/components/ui";
import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

export async function LegalPage({ title, children }: { title: string; children: React.ReactNode }) {
  const t = await getTranslations("landing.legal");
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-12">
        <Link
          href="/"
          className="text-primary min-h-11 self-start text-sm font-semibold underline-offset-4 hover:underline"
        >
          {t("back")}
        </Link>
        <h1 className="text-4xl font-extrabold">{title}</h1>
        <Alert tone="warning">{t("draft")}</Alert>
        <div className="flex flex-col gap-4 [&_h2]:mt-4 [&_h2]:text-xl [&_h2]:font-bold [&_li]:ml-5 [&_li]:list-disc [&_p]:text-pretty [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1">
          {children}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
