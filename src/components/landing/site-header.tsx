import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui";

export async function SiteHeader() {
  const t = await getTranslations("landing.nav");
  return (
    <header className="bg-background/90 sticky top-0 z-30 border-b border-blue-100 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" aria-label={t("home")} className="font-display text-primary text-2xl font-extrabold">
          Repite
        </Link>
        <nav aria-label={t("label")} className="hidden items-center gap-6 md:flex">
          {[
            ["#como-funciona", t("how")],
            ["#ventajas", t("features")],
            ["#precio", t("pricing")],
            ["#preguntas", t("faq")],
          ].map(([href, label]) => (
            <a
              key={href}
              href={href}
              className="text-muted hover:text-primary min-h-11 content-center text-sm font-semibold"
            >
              {label}
            </a>
          ))}
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link href="/entrar">{t("login")}</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/registro">{t("cta")}</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
