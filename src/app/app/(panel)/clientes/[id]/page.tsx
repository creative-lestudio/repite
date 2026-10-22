import { ArrowLeft, Pin } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getTranslations } from "next-intl/server";
import { Badge, Card } from "@/components/ui";
import { OwnerNoteForm } from "@/components/owner/owner-notes";
import { StampCard } from "@/components/stamp-card/stamp-card";
import { requireOwner } from "@/server/auth/owner";
import { getCustomerDetail } from "@/server/repositories/owner";
import { cn } from "@/lib/utils";

export default async function OwnerCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await requireOwner();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [t, format, detail] = await Promise.all([
    getTranslations("owner.customers"),
    getFormatter(),
    getCustomerDetail(id, ctx.location.id),
  ]);
  if (!detail) notFound();
  const { customer: c, program } = detail;
  const date = (d: string) => format.dateTime(new Date(d), { dateStyle: "medium", timeZone: ctx.location.timezone });

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/app/clientes"
        className="text-primary inline-flex min-h-11 items-center gap-1 self-start text-sm font-semibold"
      >
        <ArrowLeft className="size-4" aria-hidden />
        {t("back")}
      </Link>
      <header>
        <h1 className="text-3xl font-extrabold">{c.name}</h1>
        <p className="text-muted">{t("since", { date: date(c.created_at) })}</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <div className="flex flex-col gap-6">
          {program && (
            <StampCard
              total={program.stamps_required}
              filled={detail.balance}
              rewardName={program.reward_name}
              locationName={ctx.location.name}
            />
          )}
          <Card>
            <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
              <dt className="text-muted font-semibold">{t("phone")}</dt>
              <dd>{c.phone_e164}</dd>
              <dt className="text-muted font-semibold">{t("birthday")}</dt>
              <dd>
                {c.birthday
                  ? format.dateTime(new Date(c.birthday + "T12:00:00Z"), {
                      day: "numeric",
                      month: "long",
                      timeZone: "UTC",
                    })
                  : t("birthdayNone")}
              </dd>
              <dt className="text-muted font-semibold">{t("language")}</dt>
              <dd>{c.locale}</dd>
              <dt className="text-muted font-semibold">{t("usualOrder")}</dt>
              <dd>{c.usual_order ?? "—"}</dd>
              <dt className="text-muted font-semibold">{t("consent")}</dt>
              <dd>
                {c.marketing_consent ? (
                  <Badge tone="success">{t("consentYes", { date: c.consent_at ? date(c.consent_at) : "—" })}</Badge>
                ) : (
                  <Badge tone="neutral">{t("consentNo")}</Badge>
                )}
              </dd>
            </dl>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <section aria-labelledby="notes" className="flex flex-col gap-3">
            <h2 id="notes" className="text-xl font-bold">
              {t("notes")}
            </h2>
            <OwnerNoteForm customerId={c.id} />
            {detail.notes.length === 0 ? (
              <p className="text-muted text-sm">{t("notesEmpty")}</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {detail.notes.map((n) => (
                  <li key={n.id} className="bg-surface rounded-lg p-3 ring-1 ring-blue-100">
                    <p>{n.text}</p>
                    <p className="text-muted mt-1 flex items-center gap-2 text-xs">
                      {n.pinned && <Pin className="size-3" aria-hidden />}
                      {n.author && <span>{n.author}</span>}
                      <time dateTime={n.created_at}>{date(n.created_at)}</time>
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="history" className="flex flex-col gap-3">
            <h2 id="history" className="text-xl font-bold">
              {t("history")}
            </h2>
            {detail.history.length === 0 ? (
              <p className="text-muted text-sm">{t("historyEmpty")}</p>
            ) : (
              <ol className="bg-surface shadow-card divide-y divide-blue-100 rounded-xl ring-1 ring-blue-100">
                {detail.history.map((e) => {
                  const qty = e.type === "reward_issued" || e.type === "redeem" ? null : e.quantity;
                  return (
                    <li key={e.id} className="flex min-h-12 items-center justify-between gap-3 px-4 py-2">
                      <div className="flex flex-col">
                        <span className="font-semibold">{t(`events.${e.type as "visit"}`)}</span>
                        <time className="text-muted text-xs" dateTime={e.created_at}>
                          {format.dateTime(new Date(e.created_at), {
                            dateStyle: "medium",
                            timeStyle: "short",
                            timeZone: ctx.location.timezone,
                          })}
                        </time>
                      </div>
                      <div className="flex items-center gap-2">
                        {e.validation_status === "pending" && <Badge tone="warning">{t("pending")}</Badge>}
                        {e.validation_status === "rejected" && <Badge tone="neutral">{t("rejected")}</Badge>}
                        {qty !== null && e.validation_status === "approved" && (
                          <span className={cn("font-display font-bold", qty > 0 ? "text-primary" : "text-muted")}>
                            {qty > 0 ? `+${qty}` : qty}
                          </span>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
