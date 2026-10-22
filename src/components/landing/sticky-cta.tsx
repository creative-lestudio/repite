"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui";

/** Botón fijo en móvil: aparece al salir de la portada y se esconde cuando ya hay un botón de alta a la vista. */
export function StickyCta() {
  const t = useTranslations("landing.sticky");
  const [pastHero, setPastHero] = useState(false);
  const [ctaVisible, setCtaVisible] = useState(false);

  useEffect(() => {
    const hero = document.getElementById("inicio");
    const targets = ["precio", "final"].map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const io1 = hero ? new IntersectionObserver(([e]) => setPastHero(!e.isIntersecting)) : null;
    if (hero) io1?.observe(hero);
    const visible = new Set<Element>();
    const io2 = new IntersectionObserver((entries) => {
      entries.forEach((e) => (e.isIntersecting ? visible.add(e.target) : visible.delete(e.target)));
      setCtaVisible(visible.size > 0);
    });
    targets.forEach((el) => io2.observe(el));
    return () => {
      io1?.disconnect();
      io2.disconnect();
    };
  }, []);

  const show = pastHero && !ctaVisible;
  return (
    <div
      data-testid="sticky-cta"
      aria-hidden={!show}
      className={`fixed inset-x-0 bottom-0 z-20 border-t border-blue-100 bg-white/95 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur transition-transform duration-300 md:hidden ${show ? "translate-y-0" : "translate-y-full"}`}
    >
      <Button asChild size="lg" block tabIndex={show ? 0 : -1}>
        <Link href="/registro">{t("cta")}</Link>
      </Button>
    </div>
  );
}
