"use client";

import { Gift, House, Menu, QrCode, Settings, Sparkles, Users, UserRoundCog, CreditCard, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

export function OwnerNav({
  locationName,
  slug,
  email,
  signOut,
}: {
  locationName: string;
  slug: string;
  email: string;
  signOut: React.ReactNode;
}) {
  const t = useTranslations("owner.nav");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => setOpen(false), [pathname]);

  const items = [
    { href: "/app", label: t("home"), Icon: House, exact: true },
    { href: "/app/clientes", label: t("customers"), Icon: Users },
    { href: "/app/programa", label: t("program"), Icon: Gift },
    { href: "/app/equipo", label: t("team"), Icon: UserRoundCog },
    { href: "/app/qr", label: t("qr"), Icon: QrCode },
    { href: "/app/extras", label: t("bonuses"), Icon: Sparkles },
    { href: "/app/ajustes", label: t("settings"), Icon: Settings },
    { href: "/app/plan", label: t("plan"), Icon: CreditCard },
  ];

  const list = (
    <ul className="flex flex-col gap-1">
      {items.map(({ href, label, Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-11 items-center gap-3 rounded-lg px-3 font-semibold",
                active ? "bg-primary-soft text-blue-800" : "text-muted hover:bg-blue-50 hover:text-blue-800",
              )}
            >
              <Icon className="size-5 shrink-0" aria-hidden />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  const footer = (
    <div className="flex flex-col gap-2 border-t border-blue-100 pt-4">
      <Link
        href={`/c/${slug}`}
        target="_blank"
        className="text-primary min-h-11 py-2 text-sm font-semibold underline-offset-4 hover:underline"
      >
        {t("viewCard")}
      </Link>
      <p className="text-muted truncate text-xs">{email}</p>
      {signOut}
    </div>
  );

  return (
    <>
      {/* Escritorio: barra lateral fija */}
      <aside className="bg-surface hidden w-64 shrink-0 flex-col gap-6 border-r border-blue-100 p-4 md:flex">
        <div>
          <p className="font-display text-primary text-xl font-extrabold">Repite</p>
          <p className="text-muted truncate text-sm">{locationName}</p>
        </div>
        <nav aria-label={t("label")} className="flex-1">
          {list}
        </nav>
        {footer}
      </aside>

      {/* Móvil: barra superior con menú */}
      <header className="bg-surface sticky top-0 z-20 flex items-center justify-between border-b border-blue-100 px-4 py-2 md:hidden">
        <div className="min-w-0">
          <p className="font-display text-primary leading-5 font-extrabold">Repite</p>
          <p className="text-muted truncate text-xs">{locationName}</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? t("closeMenu") : t("openMenu")}
          className="hover:bg-primary-soft flex size-11 items-center justify-center rounded-lg"
        >
          {open ? <X className="size-6" aria-hidden /> : <Menu className="size-6" aria-hidden />}
        </button>
      </header>
      {open && (
        <div
          id="mobile-menu"
          className="bg-surface animate-fade-in fixed inset-x-0 top-[3.25rem] bottom-0 z-10 flex flex-col gap-6 overflow-y-auto p-4 md:hidden"
        >
          <nav aria-label={t("label")}>{list}</nav>
          {footer}
        </div>
      )}
    </>
  );
}
