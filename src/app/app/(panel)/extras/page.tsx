import { Sparkles } from "lucide-react";
import Link from "next/link";
import { getFormatter, getTranslations } from "next-intl/server";
import { Badge, EmptyState } from "@/components/ui";
import { requireOwner } from "@/server/auth/owner";
import { listBonuses } from "@/server/repositories/owner";

export default async function BonusesPage() {
  const ctx = await requireOwner();
  const [t, format, items] = await Promise.all([getTranslations("owner.bonuses"), getFormatter(), listBonuses()]);
  const pending = items.filter((i) => i.status === "pending");
  const approved = items.filter((i) => i.status === "approved").length;
  const tone = { pending: "warning", approved: "success", rejected: "neutral" } as const;

  const row = (i: (typeof items)[number]) => (
    <li key={i.id} className="flex min-h-14 flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3">
      <div className="flex min-w-0 flex-1 flex-col">
        {i.customerId ? (
          <Link href={`/app/clientes/${i.customerId}`} className="truncate font-semibold hover:underline">
            {i.customerName}
          </Link>
        ) : (
          <span className="font-semibold">{i.customerName}</span>
        )}
        <span className="text-muted text-sm">
          {t(`type.${i.type}`)}
          {i.handle ? ` · ${t("handle", { handle: i.handle })}` : ""} ·{" "}
          {format.dateTime(new Date(i.created_at), { dateStyle: "medium", timeZone: ctx.location.timezone })}
        </span>
      </div>
      <Badge tone={tone[i.status]}>{t(`status.${i.status}`)}</Badge>
    </li>
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold">{t("title")}</h1>
        <p className="text-muted mt-1">{t("intro")}</p>
        {items.length > 0 && (
          <p className="text-muted mt-1 text-sm">{t("stats", { approved, pending: pending.length })}</p>
        )}
      </div>

      <section aria-labelledby="pend" className="flex flex-col gap-2">
        <h2 id="pend" className="text-xl font-bold">
          {t("pendingTitle")}
        </h2>
        {pending.length === 0 ? (
          <p className="text-muted text-sm">{t("pendingEmpty")}</p>
        ) : (
          <ul className="bg-surface shadow-card divide-y divide-blue-100 rounded-xl ring-1 ring-blue-100">
            {pending.map(row)}
          </ul>
        )}
      </section>

      <section aria-labelledby="hist" className="flex flex-col gap-2">
        <h2 id="hist" className="text-xl font-bold">
          {t("historyTitle")}
        </h2>
        {items.length === 0 ? (
          <EmptyState icon={<Sparkles />} title={t("historyEmpty")} />
        ) : (
          <ul className="bg-surface shadow-card divide-y divide-blue-100 rounded-xl ring-1 ring-blue-100">
            {items.map(row)}
          </ul>
        )}
      </section>
    </div>
  );
}
