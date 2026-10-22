import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Logo } from "@/components/brand/logo";

export async function SiteFooter() {
  const t = await getTranslations("landing");
  const tn = await getTranslations("landing.nav");
  const f = await getTranslations("landing.footer");
  const link = "inline-flex min-h-11 items-center text-sm text-stone-400 hover:text-white";
  const heading = "text-cream-50 mb-1 text-sm font-bold";
  return (
    <footer className="bg-ink-950 text-cream-100">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 md:grid-cols-[2fr_1fr_1fr_1fr]">
        <div>
          <Link href="/" aria-label="Repite, inicio">
            <Logo className="text-cream-100 h-9" />
          </Link>
          <p className="font-display text-cream-50 mt-4 max-w-xs text-lg font-bold">{f("tagline")}</p>
        </div>
        <nav aria-label={f("product")}>
          <p className={heading}>{f("product")}</p>
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
          <p className={heading}>{f("account")}</p>
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
          <p className={heading}>{f("legal")}</p>
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
      <p className="border-t border-white/10 px-4 py-4 text-center text-xs text-stone-400">
        {f("rights", { year: String(new Date().getFullYear()) })}
      </p>
    </footer>
  );
}
