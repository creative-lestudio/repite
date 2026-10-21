"use client";

import { Gift, History, Settings, Sparkles, Stamp } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export function BottomNav({ slug }: { slug: string }) {
  const t = useTranslations("customer.nav");
  const pathname = usePathname();
  const base = `/c/${slug}`;
  const items = [
    { href: base, label: t("card"), Icon: Stamp },
    { href: `${base}/premios`, label: t("rewards"), Icon: Gift },
    { href: `${base}/extra`, label: t("extra"), Icon: Sparkles },
    { href: `${base}/historial`, label: t("history"), Icon: History },
    { href: `${base}/ajustes`, label: t("settings"), Icon: Settings },
  ];
  return (
    <nav
      aria-label={t("label")}
      className="bg-surface/95 fixed inset-x-0 bottom-0 z-10 border-t border-blue-100 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <ul className="mx-auto grid max-w-md grid-cols-5">
        {items.map(({ href, label, Icon }) => {
          const active = pathname === href;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-[0.6875rem] font-semibold",
                  active ? "text-primary" : "text-muted hover:text-blue-800",
                )}
              >
                <Icon className="size-6" aria-hidden strokeWidth={active ? 2.5 : 2} />
                <span className="truncate">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
