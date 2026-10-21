"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Alert, Button, Field, Input } from "@/components/ui";
import { requestBonusAction, type BonusState } from "@/server/actions/customer";

export function BonusForm({
  slug,
  type,
  fieldLabel,
  placeholder,
}: {
  slug: string;
  type: "bonus_story" | "bonus_review";
  fieldLabel: string;
  placeholder: string;
}) {
  const t = useTranslations("customer.extra");
  const te = useTranslations("errors");
  const tc = useTranslations("common");
  const [state, action, pending] = useActionState<BonusState, FormData>(requestBonusAction.bind(null, slug), null);

  if (state?.ok) return <Alert tone="success">{t("sent")}</Alert>;

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="type" value={type} />
      {state && !state.ok && <Alert tone="danger">{te(state.error as never)}</Alert>}
      <Field id={`${type}-handle`} label={fieldLabel} optionalLabel={tc("optional")}>
        <Input name="handle" placeholder={placeholder} maxLength={80} autoComplete="off" />
      </Field>
      <Button type="submit" variant="secondary" block loading={pending}>
        {t("send")}
      </Button>
    </form>
  );
}
