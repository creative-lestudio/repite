import { Download, Gift, Search, Users } from "lucide-react";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { Badge, Button, EmptyState, Input } from "@/components/ui";
import { requireOwner } from "@/server/auth/owner";
import { CUSTOMERS_PAGE_SIZE, listCustomers, type CustomerFilter } from "@/server/repositories/owner";

const FILTERS: Record<string, CustomerFilter> = {
  todos: "todos",
  premio: "premio",
  ausentes: "ausentes",
  "sin-permiso": "sin-permiso",
};
const FILTER_LABEL = { todos: "all", premio: "reward", ausentes: "inactive", "sin-permiso": "noConsent" } as const;

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; filtro?: string; pagina?: string }>;
}) {
  const ctx = await requireOwner();
  const sp = await searchParams;
  const filter = FILTERS[sp.filtro ?? ""] ?? "todos";
  const page = Math.max(1, Number.parseInt(sp.pagina ?? "1", 10) || 1);
  const q = (sp.q ?? "").slice(0, 60);
  const [t, format, { rows, total }] = await Promise.all([
    getTranslations("owner.customers"),
    getFormatter(),
    listCustomers({ q, filter, page }),
  ]);
  const pages = Math.max(1, Math.ceil(total / CUSTOMERS_PAGE_SIZE));
  const href = (p: number) =>
    `/app/clientes?${new URLSearchParams({ ...(q && { q }), filtro: filter, pagina: String(p) })}`;
  const hasFilters = !!q || filter !== "todos";

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-extrabold">{t("title")}</h1>
          <p className="text-muted">{t("count", { count: total })}</p>
        </div>
        {ctx.role !== "staff" && (
          <Button asChild variant="secondary">
            <a href="/app/clientes/exportar" download>
              <Download aria-hidden />
              {t("export")}
            </a>
          </Button>
        )}
      </header>

      <form className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end" role="search">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="q" className="text-sm font-semibold">
            {t("searchLabel")}
          </label>
          <div className="relative">
            <Search
              className="text-muted pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2"
              aria-hidden
            />
            <Input id="q" name="q" type="search" defaultValue={q} className="pl-12" autoComplete="off" />
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="filtro" className="text-sm font-semibold">
            {t("filterLabel")}
          </label>
          <select
            id="filtro"
            name="filtro"
            defaultValue={filter}
            className="border-border bg-surface focus-visible:border-primary focus-visible:ring-primary/25 min-h-12 rounded-lg border px-3 text-base focus-visible:ring-3 focus-visible:outline-none"
          >
            {Object.entries(FILTER_LABEL).map(([value, key]) => (
              <option key={value} value={value}>
                {t(`filters.${key}`)}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit">{t("apply")}</Button>
      </form>

      {rows.length === 0 ? (
        hasFilters ? (
          <EmptyState icon={<Search />} title={t("emptyTitle")} description={t("emptyBody")} />
        ) : (
          <EmptyState icon={<Users />} title={t("emptyAllTitle")} description={t("emptyAllBody")} />
        )
      ) : (
        <ul className="bg-surface shadow-card divide-y divide-blue-100 rounded-xl ring-1 ring-blue-100">
          {rows.map((c) => (
            <li key={c.id}>
              <Link
                href={`/app/clientes/${c.id}`}
                className="flex min-h-16 flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-blue-50"
              >
                <span className="bg-primary-soft text-primary font-display flex size-10 shrink-0 items-center justify-center rounded-full font-bold">
                  {c.name.charAt(0).toUpperCase()}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate font-semibold">{c.name}</span>
                  <span className="text-muted text-sm">
                    {c.last_visit_at
                      ? t("lastVisit", { when: format.relativeTime(new Date(c.last_visit_at), new Date()) })
                      : t("never")}
                  </span>
                </span>
                <span className="flex flex-wrap items-center gap-2">
                  {c.rewards_available > 0 && (
                    <Badge tone="solid">
                      <Gift className="size-3" aria-hidden />
                      {t("rewardReady")}
                    </Badge>
                  )}
                  {!c.marketing_consent && <Badge tone="neutral">{t("noConsentBadge")}</Badge>}
                  <span className="text-muted text-sm">
                    {t("visits", { count: c.visits })} · {t("stamps", { count: c.balance })}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {pages > 1 && (
        <nav className="flex items-center justify-between gap-3" aria-label={t("page", { page })}>
          <Button asChild variant="secondary" size="sm" className={page <= 1 ? "pointer-events-none opacity-50" : ""}>
            <Link href={href(page - 1)} aria-disabled={page <= 1} tabIndex={page <= 1 ? -1 : undefined}>
              {t("prev")}
            </Link>
          </Button>
          <span className="text-muted text-sm">
            {t("page", { page })} / {pages}
          </span>
          <Button
            asChild
            variant="secondary"
            size="sm"
            className={page >= pages ? "pointer-events-none opacity-50" : ""}
          >
            <Link href={href(page + 1)} aria-disabled={page >= pages} tabIndex={page >= pages ? -1 : undefined}>
              {t("next")}
            </Link>
          </Button>
        </nav>
      )}
    </div>
  );
}
