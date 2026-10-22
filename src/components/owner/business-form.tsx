"use client";

import { useActionState, useState } from "react";
import { useTranslations } from "next-intl";
import { Alert, Button, Field, Input } from "@/components/ui";
import { slugify } from "@/domain/slug";
import { createBusinessAction, type FormState } from "@/server/actions/owner";

const selectClass =
  "min-h-12 w-full rounded-lg border border-border bg-surface px-3 text-base text-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/25";

export function BusinessForm() {
  const t = useTranslations("owner.start");
  const te = useTranslations("errors");
  const [state, action, pending] = useActionState<FormState, FormData>(createBusinessAction, null);
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  const fields = state && !state.ok ? (state.fields ?? {}) : {};
  const err = (n: string) => (fields[n] ? te(fields[n] as never) : undefined);
  const formError = state && !state.ok && state.error !== "form" ? te(state.error as never) : null;

  return (
    <form action={action} className="flex flex-col gap-8" noValidate>
      {formError && <Alert tone="danger">{formError}</Alert>}

      <fieldset className="flex flex-col gap-4">
        <legend className="font-display mb-1 text-lg font-bold">{t("business")}</legend>
        <Field id="businessName" label={t("businessName")} error={err("businessName")}>
          <Input name="businessName" placeholder={t("businessNamePlaceholder")} maxLength={120} required />
        </Field>
        <Field id="country" label={t("country")} hint={t("countryHint")}>
          <select name="country" defaultValue="ES" className={selectClass}>
            <option value="ES">{t("countries.ES")}</option>
            <option value="VE">{t("countries.VE")}</option>
          </select>
        </Field>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="font-display mb-1 text-lg font-bold">{t("location")}</legend>
        <Field id="locationName" label={t("locationName")} hint={t("locationHint")} error={err("locationName")}>
          <Input
            name="locationName"
            maxLength={120}
            required
            onChange={(e) => {
              if (!slugTouched) setSlug(slugify(e.target.value));
            }}
          />
        </Field>
        <Field id="slug" label={t("slug")} hint={t("slugHint", { slug: slug || "tu-local" })} error={err("slug")}>
          <Input
            name="slug"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value.toLowerCase());
            }}
            maxLength={50}
            autoCapitalize="none"
            autoCorrect="off"
            required
          />
        </Field>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="font-display mb-1 text-lg font-bold">{t("program")}</legend>
        <Field id="stamps" label={t("stamps")} hint={t("stampsHint")} error={err("stamps")}>
          <Input name="stamps" type="number" inputMode="numeric" min={3} max={30} defaultValue={8} required />
        </Field>
        <Field id="rewardName" label={t("reward")} error={err("rewardName")}>
          <Input name="rewardName" placeholder={t("rewardPlaceholder")} maxLength={80} required />
        </Field>
      </fieldset>

      <Button type="submit" size="lg" block loading={pending}>
        {t("submit")}
      </Button>
    </form>
  );
}
