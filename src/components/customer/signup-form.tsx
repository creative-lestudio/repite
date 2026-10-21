"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Alert, Button, Checkbox, Field, Input } from "@/components/ui";
import { signUpAction, type SignupState } from "@/server/actions/customer";

const selectClass =
  "min-h-12 w-full rounded-lg border border-border bg-surface px-3 text-base text-foreground focus-visible:border-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/25 aria-invalid:border-danger";

export function SignupForm({ slug, locationName }: { slug: string; locationName: string }) {
  const t = useTranslations("customer.signup");
  const te = useTranslations("errors");
  const tc = useTranslations("common");
  const [state, action, pending] = useActionState<SignupState, FormData>(signUpAction.bind(null, slug), null);

  const fields = state && !state.ok && "fields" in state ? (state.fields ?? {}) : {};
  const fieldError = (name: string) => (fields[name] ? te(fields[name] as never) : undefined);

  if (state && !state.ok && state.error === "phoneExists") {
    return (
      <div className="flex flex-col gap-4">
        <Alert tone="info" title={t("phoneExistsTitle")}>
          {t("phoneExistsBody")}
        </Alert>
        <Button asChild variant="secondary" block>
          <Link href={`/c/${slug}/recuperar`}>{t("recover")}</Link>
        </Button>
      </div>
    );
  }

  const formError = state && !state.ok && state.error !== "form" ? te(state.error as never) : null;

  return (
    <form action={action} className="flex flex-col gap-5" noValidate>
      {formError && <Alert tone="danger">{formError}</Alert>}
      <Field id="name" label={t("name")} error={fieldError("name")}>
        <Input name="name" autoComplete="given-name" placeholder={t("namePlaceholder")} required maxLength={80} />
      </Field>
      <Field id="phone" label={t("phone")} hint={t("phoneHint")} error={fieldError("phone")}>
        <Input name="phone" type="tel" inputMode="tel" autoComplete="tel" required />
      </Field>
      <fieldset className="flex flex-col gap-1.5">
        <legend className="text-sm font-semibold">
          {t("birthday")} <span className="text-muted font-normal">({tc("optional")})</span>
        </legend>
        <p id="birthday-hint" className="text-muted text-sm">
          {t("birthdayHint")}
        </p>
        <div className="mt-1 grid grid-cols-[5.5rem_1fr] gap-3">
          <label className="sr-only" htmlFor="birthDay">
            {t("day")}
          </label>
          <select
            id="birthDay"
            name="birthDay"
            defaultValue=""
            className={selectClass}
            aria-describedby="birthday-hint"
            aria-invalid={fieldError("birthDay") ? true : undefined}
          >
            <option value="">{t("day")}</option>
            {Array.from({ length: 31 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
          <label className="sr-only" htmlFor="birthMonth">
            {t("month")}
          </label>
          <select
            id="birthMonth"
            name="birthMonth"
            defaultValue=""
            className={selectClass}
            aria-describedby="birthday-hint"
          >
            <option value="">{t("month")}</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i} value={i + 1}>
                {t(`months.m${(i + 1) as 1}`)}
              </option>
            ))}
          </select>
        </div>
        {fieldError("birthDay") && (
          <p role="alert" className="text-danger text-sm font-medium">
            {fieldError("birthDay")}
          </p>
        )}
      </fieldset>
      <Checkbox
        id="consent"
        name="consent"
        label={t("consent", { location: locationName })}
        description={t("consentHint")}
      />
      <Button type="submit" size="lg" block loading={pending}>
        {t("submit")}
      </Button>
      <p className="text-muted text-xs">{t("legal", { location: locationName })}</p>
      <p className="text-center text-sm">
        <span className="text-muted">{t("haveCard")} </span>
        <Link className="text-primary font-semibold underline-offset-4 hover:underline" href={`/c/${slug}/recuperar`}>
          {t("recover")}
        </Link>
      </p>
    </form>
  );
}
