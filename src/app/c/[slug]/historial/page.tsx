import { History } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import { Badge, EmptyState } from "@/components/ui";
import { requireCustomer } from "@/server/auth/require-customer";
import { getCustomerHistory } from "@/server/repositories/customers";
import { cn } from "@/lib/utils";

export default async function HistoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { location, customer } = await requireCustomer(slug);
  const [t, format, items] = await Promise.all([
    getTranslations("customer.history"),
    getFormatter(),
    getCustomerHistory(location.organizationId, customer.id),
  ]);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold">{t("title")}</h1>
      {items.length === 0 ? (
        <EmptyState icon={<History />} title={t("emptyTitle")} description={t("emptyBody")} />
      ) : (
        <ol className="bg-surface shadow-card divide-y divide-blue-100 rounded-xl ring-1 ring-blue-100">
          {items.map((e) => {
            const qty = e.type === "reward_issued" || e.type === "redeem" ? null : e.quantity;
            return (
              <li key={e.id} className="flex min-h-14 items-center justify-between gap-3 px-4 py-3">
                <div className="flex flex-col">
                  <span className="font-semibold">{t(e.type)}</span>
                  <time className="text-muted text-sm" dateTime={e.created_at}>
                    {format.dateTime(new Date(e.created_at), {
                      dateStyle: "medium",
                      timeStyle: "short",
                      timeZone: location.timezone,
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
    </div>
  );
}
