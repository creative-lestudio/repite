"use client";

import { ChevronRight, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui";
import { searchCustomersAction } from "@/server/actions/staff";
import type { CustomerHit } from "@/server/repositories/staff";
import { maskPhone } from "@/domain/phone";

export function CustomerSearch() {
  const t = useTranslations("staff.home");
  const te = useTranslations("errors");
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<CustomerHit[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    const q = query.trim();
    const enough = q.replace(/\D/g, "").length >= 3 || q.length >= 2;
    if (!enough) {
      setHits(null);
      return;
    }
    const timer = setTimeout(
      () =>
        start(async () => {
          const r = await searchCustomersAction(q);
          if (r.ok) {
            setHits(r.data);
            setError(null);
          } else setError(r.error);
        }),
      250,
    );
    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="flex flex-col gap-2" role="search">
      <label htmlFor="customer-search" className="text-sm font-semibold">
        {t("searchLabel")}
      </label>
      <div className="relative">
        <Search
          className="text-muted pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2"
          aria-hidden
        />
        <Input
          id="customer-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("searchPlaceholder")}
          autoComplete="off"
          aria-describedby="customer-search-hint"
          className="min-h-14 pl-12 text-lg"
        />
      </div>
      <p id="customer-search-hint" className="text-muted text-sm">
        {t("searchHint")}
      </p>
      <div aria-live="polite" aria-busy={pending}>
        {error && <p className="text-danger text-sm">{te(error as never)}</p>}
        {hits && hits.length === 0 && (
          <p className="text-muted py-3 text-sm">{t("noResults", { query: query.trim() })}</p>
        )}
        {hits && hits.length > 0 && (
          <ul className="bg-surface shadow-card divide-y divide-blue-100 rounded-xl ring-1 ring-blue-100">
            {hits.map((h) => (
              <li key={h.id}>
                <Link
                  href={`/equipo/clientes/${h.id}`}
                  className="flex min-h-14 items-center gap-3 px-4 py-2 hover:bg-blue-50"
                >
                  <span className="bg-primary-soft text-primary font-display flex size-10 shrink-0 items-center justify-center rounded-full font-bold">
                    {h.name.charAt(0)}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate font-semibold">{h.name}</span>
                    <span className="text-muted text-sm">{maskPhone(h.phone_e164)}</span>
                  </span>
                  <ChevronRight className="text-muted size-5" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
