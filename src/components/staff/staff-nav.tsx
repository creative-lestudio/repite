"use client";

import { House, ScanLine, Sparkles } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export function StaffNav({ pendingCount }: { pendingCount: number }) {
  const t = useTranslations("staff.nav");
  const pathname = usePathname();
  const items = [
    { href: "/equipo", label: t("home"), Icon: House },
    { href: "/equipo/escanear", label: t("scan"), Icon: ScanLine },
    { href: "/equipo/pendientes", label: t("pending"), Icon: Sparkles, badge: pendingCount },
  ];
  return (
    <nav
      aria-label={t("label")}
      className="bg-surface/95 fixed inset-x-0 bottom-0 z-10 border-t border-blue-100 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <ul className="mx-auto grid max-w-3xl grid-cols-3">
        {items.map(({ href, label, Icon, badge }) => {
          const active = pathname === href;
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex min-h-16 flex-col items-center justify-center gap-1 text-xs font-semibold",
                  active ? "text-primary" : "text-muted hover:text-blue-800",
                )}
              >
                <span className="relative">
                  <Icon className="size-6" aria-hidden strokeWidth={active ? 2.5 : 2} />
                  {badge ? (
                    <span className="bg-danger absolute -top-1.5 -right-3 min-w-5 rounded-full px-1 text-center text-[0.6875rem] leading-5 text-white">
                      {badge}
                    </span>
                  ) : null}
                </span>
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
