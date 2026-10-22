import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/logo";

export async function SiteFooter() {
  const t = await getTranslations("landing");
  const tn = await getTranslations("landing.nav");
  const f = await getTranslations("landing.footer");
  const link = "text-muted hover:text-primary inline-flex min-h-11 items-center text-sm";
  return (
    <footer className="border-t border-blue-100 bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-[2fr_1fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="text-muted mt-2 max-w-xs text-sm">{f("tagline")}</p>
        </div>
        <nav aria-label={f("product")}>
          <p className="mb-1 text-sm font-bold">{f("product")}</p>
          <ul>
            <li>
              <Link className={link} href="/#como-funciona">
                {tn("how")}
              </Link>
            </li>
            <li>
              <Link className={link} href="/#precio">
                {tn("pricing")}
              </Link>
            </li>
            <li>
              <Link className={link} href="/c/cafe-aurora">
                {f("demo")}
              </Link>
            </li>
          </ul>
        </nav>
        <nav aria-label={f("account")}>
          <p className="mb-1 text-sm font-bold">{f("account")}</p>
          <ul>
            <li>
              <Link className={link} href="/entrar">
                {tn("login")}
              </Link>
            </li>
            <li>
              <Link className={link} href="/registro">
                {t("hero.cta")}
              </Link>
            </li>
          </ul>
        </nav>
        <nav aria-label={f("legal")}>
          <p className="mb-1 text-sm font-bold">{f("legal")}</p>
          <ul>
            <li>
              <Link className={link} href="/legal/privacidad">
                {f("privacy")}
              </Link>
            </li>
            <li>
              <Link className={link} href="/legal/terminos">
                {f("terms")}
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      <p className="text-muted border-t border-blue-100 px-4 py-4 text-center text-xs">
        {f("rights", { year: String(new Date().getFullYear()) })}
      </p>
    </footer>
  );
}
