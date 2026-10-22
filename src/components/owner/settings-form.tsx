"use client";

import Link from "next/link";
import { useActionState, useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Alert, Button, Card, Field, Input } from "@/components/ui";
import { useToast } from "@/components/staff/toaster";
import { BusinessTypePicker } from "@/components/owner/business-type-picker";
import type { BusinessType } from "@/domain/business-types";
import { geocodeAddressAction } from "@/server/actions/geocode";
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
  averageTicket: string;
  latitude: string;
  longitude: string;
  proximityAllowed: boolean;
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
  const formRef = useRef<HTMLFormElement>(null);
  const [lat, setLat] = useState(v.latitude);
  const [lng, setLng] = useState(v.longitude);
  const [searching, startSearch] = useTransition();
  const tp = useTranslations("owner.plan");

  const findCoords = () =>
    startSearch(async () => {
      const address = String(new FormData(formRef.current!).get("address") ?? "");
      const r = await geocodeAddressAction(address);
      if (r.ok) {
        setLat(String(r.coords.latitude));
        setLng(String(r.coords.longitude));
        toast({ tone: "success", text: t("geocodeDone") });
      } else toast({ tone: "danger", text: te(r.error as never) });
    });
  const [state, action, pending] = useActionState<FormState, FormData>(saveSettingsAction, null);
  useEffect(() => {
    if (state?.ok) toast({ tone: "success", text: t("saved") });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const fields = state && !state.ok ? (state.fields ?? {}) : {};
  const err = (n: string) => (fields[n] ? te(fields[n] as never) : undefined);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-6" noValidate>
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
        <h2 className="text-lg font-bold">{t("proximityTitle")}</h2>
        <p className="text-muted text-sm">{t("proximityHint")}</p>
        {!v.proximityAllowed && (
          <p className="bg-cream-100 flex flex-wrap items-center gap-x-3 rounded-lg px-3 py-2 text-sm font-semibold">
            {tp("locked", { plan: "plus" })}
            <Link href="/app/plan" className="text-primary underline underline-offset-4">
              {tp("upgradeLink")}
            </Link>
          </p>
        )}
        <fieldset disabled={!v.proximityAllowed} className="flex flex-col gap-4 disabled:opacity-60">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="latitude" label={t("latitude")} error={err("latitude")}>
              <Input
                name="latitude"
                inputMode="decimal"
                value={lat}
                onChange={(e) => setLat(e.target.value)}
                maxLength={20}
                placeholder="40.4168"
              />
            </Field>
            <Field id="longitude" label={t("longitude")}>
              <Input
                name="longitude"
                inputMode="decimal"
                value={lng}
                onChange={(e) => setLng(e.target.value)}
                maxLength={20}
                placeholder="-3.7038"
              />
            </Field>
          </div>
          <Button type="button" variant="secondary" loading={searching} onClick={findCoords} className="self-start">
            {t("geocode")}
          </Button>
          <p className="text-muted text-xs">{t("coordsHelp")}</p>
        </fieldset>
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
        <Field id="averageTicket" label={t("averageTicket")} hint={t("averageTicketHint")} error={err("averageTicket")}>
          <Input
            name="averageTicket"
            type="text"
            inputMode="decimal"
            defaultValue={v.averageTicket}
            maxLength={8}
            placeholder="7"
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
