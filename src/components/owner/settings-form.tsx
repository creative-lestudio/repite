"use client";

import { useActionState, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Alert, Button, Card, Field, Input } from "@/components/ui";
import { useToast } from "@/components/staff/toaster";
import { BusinessTypePicker } from "@/components/owner/business-type-picker";
import type { BusinessType } from "@/domain/business-types";
import { saveSettingsAction, type FormState } from "@/server/actions/owner";

const selectClass =
  "min-h-12 w-full rounded-lg border border-input bg-surface px-3 text-base focus-visible:border-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/25";

export interface SettingsValues {
  name: string;
  address: string;
  openingHours: string;
  locale: string;
  timezone: string;
  cooldownHours: number;
  messageGapDays: number;
  whatsapp: string;
  instagram: string;
  reviewUrl: string;
  country: string;
  currency: string;
  businessType: BusinessType;
}

export function SettingsForm({ v }: { v: SettingsValues }) {
  const t = useTranslations("owner.settings");
  const te = useTranslations("errors");
  const ts = useTranslations("owner.start.countries");
  const toast = useToast();
  const [type, setType] = useState<BusinessType>(v.businessType);
  const [state, action, pending] = useActionState<FormState, FormData>(saveSettingsAction, null);
  useEffect(() => {
    if (state?.ok) toast({ tone: "success", text: t("saved") });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const fields = state && !state.ok ? (state.fields ?? {}) : {};
  const err = (n: string) => (fields[n] ? te(fields[n] as never) : undefined);

  return (
    <form action={action} className="flex flex-col gap-6" noValidate>
      {state && !state.ok && (
        <Alert tone="danger">{te((state.error === "form" ? "settingsInvalid" : state.error) as never)}</Alert>
      )}

      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-bold">{t("businessTitle")}</h2>
        <Field id="name" label={t("name")} error={err("name")}>
          <Input name="name" defaultValue={v.name} maxLength={120} required />
        </Field>
        <fieldset className="flex flex-col gap-2">
          <legend className="text-sm font-semibold">{t("businessType")}</legend>
          <p className="text-muted text-sm">{t("businessTypeHint")}</p>
          <BusinessTypePicker value={type} onChange={setType} />
        </fieldset>
        <Field id="address" label={t("address")}>
          <Input name="address" defaultValue={v.address} placeholder={t("addressPlaceholder")} maxLength={200} />
        </Field>
        <Field id="openingHours" label={t("hours")}>
          <Input
            name="openingHours"
            defaultValue={v.openingHours}
            placeholder={t("hoursPlaceholder")}
            maxLength={200}
          />
        </Field>
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-bold">{t("regionTitle")}</h2>
        <Field id="locale" label={t("locale")}>
          <select name="locale" defaultValue={v.locale} className={selectClass}>
            <option value="es-ES">Español (España)</option>
            <option value="es-VE">Español (Venezuela)</option>
          </select>
        </Field>
        <Field id="timezone" label={t("timezone")}>
          <select name="timezone" defaultValue={v.timezone} className={selectClass}>
            <option value="Europe/Madrid">Madrid (península y Baleares)</option>
            <option value="Atlantic/Canary">Canarias</option>
            <option value="America/Caracas">Caracas</option>
          </select>
        </Field>
        <div>
          <p className="text-sm font-semibold">{t("country")}</p>
          <p>{t("countryValue", { country: ts(v.country as "ES"), currency: v.currency })}</p>
          <p className="text-muted text-sm">{t("countryHint")}</p>
        </div>
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-bold">{t("rulesTitle")}</h2>
        <Field id="cooldownHours" label={t("cooldown")} hint={t("cooldownHint")} error={err("cooldownHours")}>
          <Input
            name="cooldownHours"
            type="number"
            inputMode="decimal"
            min={0}
            max={72}
            step="0.5"
            defaultValue={v.cooldownHours}
          />
        </Field>
        <Field id="messageGapDays" label={t("messageGap")} hint={t("messageGapHint")} error={err("messageGapDays")}>
          <Input
            name="messageGapDays"
            type="number"
            inputMode="numeric"
            min={1}
            max={90}
            defaultValue={v.messageGapDays}
          />
        </Field>
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="text-lg font-bold">{t("contactTitle")}</h2>
        <Field id="whatsapp" label={t("whatsapp")}>
          <Input name="whatsapp" type="tel" inputMode="tel" defaultValue={v.whatsapp} maxLength={30} />
        </Field>
        <Field id="instagram" label={t("instagram")}>
          <Input
            name="instagram"
            defaultValue={v.instagram}
            placeholder={t("instagramPlaceholder")}
            maxLength={60}
            autoCapitalize="none"
          />
        </Field>
        <Field id="reviewUrl" label={t("review")} hint={t("reviewHint")} error={err("reviewUrl")}>
          <Input
            name="reviewUrl"
            type="url"
            inputMode="url"
            defaultValue={v.reviewUrl}
            maxLength={300}
            placeholder="https://"
          />
        </Field>
      </Card>

      <Button type="submit" size="lg" loading={pending} className="self-start">
        {t("save")}
      </Button>
    </form>
  );
}
