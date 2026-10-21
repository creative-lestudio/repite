"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Alert, Button, Field, Input } from "@/components/ui";
import { requestAccessLinkAction, type AccessState } from "@/server/actions/customer";

export function RecoverForm({ slug, locationName }: { slug: string; locationName: string }) {
  const t = useTranslations("customer.recover");
  const ts = useTranslations("customer.signup");
  const te = useTranslations("errors");
  const [state, action, pending] = useActionState<AccessState, FormData>(
    requestAccessLinkAction.bind(null, slug),
    null,
  );

  if (state?.ok) return <Alert tone="success">{t("sent", { location: locationName })}</Alert>;

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      <Field id="phone" label={ts("phone")} error={state && !state.ok ? te(state.error as never) : undefined}>
        <Input name="phone" type="tel" inputMode="tel" autoComplete="tel" required />
      </Field>
      <Button type="submit" size="lg" block loading={pending}>
        {t("submit")}
      </Button>
    </form>
  );
}
