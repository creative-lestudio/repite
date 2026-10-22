import { getTranslations } from "next-intl/server";
import { SettingsForm } from "@/components/owner/settings-form";
import { requireManager } from "@/server/auth/owner";

export default async function SettingsPage() {
  const ctx = await requireManager();
  const t = await getTranslations("owner.settings");
  const s = ctx.location.settings as Record<string, string | number | null | undefined>;
  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <h1 className="text-3xl font-extrabold">{t("title")}</h1>
      <SettingsForm
        v={{
          name: ctx.location.name,
          address: ctx.location.address ?? "",
          openingHours: String(s.opening_hours ?? ""),
          locale: ctx.location.locale,
          timezone: ctx.location.timezone,
          cooldownHours: Number(s.stamp_cooldown_hours ?? 4),
          messageGapDays: Number(s.message_min_days ?? 7),
          averageTicket: s.average_ticket ? String(s.average_ticket) : "",
          whatsapp: String(s.contact_whatsapp ?? ""),
          instagram: String(s.instagram_handle ?? ""),
          reviewUrl: String(s.google_review_url ?? ""),
          country: ctx.organization.country,
          currency: ctx.organization.currency,
          businessType: ctx.location.businessType,
        }}
      />
    </div>
  );
}
