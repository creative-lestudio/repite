"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Alert, Checkbox } from "@/components/ui";
import { updatePreferencesAction } from "@/server/actions/customer";
import { locales } from "@/i18n/config";

export function PreferencesForm({
  slug,
  locationName,
  locale,
  consent,
}: {
  slug: string;
  locationName: string;
  locale: string;
  consent: boolean;
}) {
  const t = useTranslations("customer.settings");
  const te = useTranslations("errors");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [status, setStatus] = useState<"idle" | "saved" | string>("idle");

  const save = (prefs: { locale?: string; marketingConsent?: boolean }) =>
    start(async () => {
      const r = await updatePreferencesAction(slug, prefs);
      setStatus(r.ok ? "saved" : r.error);
      if (r.ok && prefs.locale) router.refresh();
    });

  return (
    <div className="flex flex-col gap-5" aria-busy={pending}>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="locale" className="text-sm font-semibold">
          {t("language")}
        </label>
        <select
          id="locale"
          defaultValue={locale}
          onChange={(e) => save({ locale: e.target.value })}
          className="border-input bg-surface focus-visible:border-primary focus-visible:ring-primary/25 min-h-12 rounded-lg border px-3 text-base focus-visible:ring-3 focus-visible:outline-none"
        >
          {locales.map((l) => (
            <option key={l} value={l}>
              {t(`languages.${l}`)}
            </option>
          ))}
        </select>
      </div>
      <fieldset className="flex flex-col gap-1">
        <legend className="text-sm font-semibold">{t("messages")}</legend>
        <Checkbox
          id="consent"
          defaultChecked={consent}
          onChange={(e) => save({ marketingConsent: e.target.checked })}
          label={t("messagesOn", { location: locationName })}
          description={t("messagesHint")}
        />
      </fieldset>
      <div aria-live="polite">
        {status === "saved" && <Alert tone="success">{t("saved")}</Alert>}
        {status !== "idle" && status !== "saved" && <Alert tone="danger">{te(status as never)}</Alert>}
      </div>
    </div>
  );
}
