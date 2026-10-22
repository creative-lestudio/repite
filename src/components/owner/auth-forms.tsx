"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Alert, Button, Field, Input } from "@/components/ui";
import { loginAction, magicLinkAction, signUpOwnerAction, type AuthState } from "@/server/actions/auth";

function useErrors(state: AuthState) {
  const te = useTranslations("errors");
  const fields = state && !state.ok && state.fields ? state.fields : {};
  return {
    field: (name: string) => (fields[name] ? te(fields[name] as never) : undefined),
    form: state && !state.ok && state.error !== "form" ? te(state.error as never) : null,
  };
}

export function LoginForm({ next, linkError }: { next: string; linkError: boolean }) {
  const t = useTranslations("auth.login");
  const [state, action, pending] = useActionState<AuthState, FormData>(loginAction.bind(null, next), null);
  const [magicState, magicAction, magicPending] = useActionState<AuthState, FormData>(
    magicLinkAction.bind(null, next),
    null,
  );
  const e = useErrors(state);
  const m = useErrors(magicState);

  return (
    <div className="flex flex-col gap-6">
      {linkError && <Alert tone="warning">{t("linkError")}</Alert>}
      <form action={action} className="flex flex-col gap-4" noValidate>
        {e.form && <Alert tone="danger">{e.form}</Alert>}
        <Field id="email" label={t("email")} error={e.field("email")}>
          <Input name="email" type="email" autoComplete="email" inputMode="email" required />
        </Field>
        <Field id="password" label={t("password")} error={e.field("password")}>
          <Input name="password" type="password" autoComplete="current-password" required />
        </Field>
        <Button type="submit" size="lg" block loading={pending}>
          {t("submit")}
        </Button>
      </form>

      <div className="text-muted flex items-center gap-3 text-sm" aria-hidden>
        <span className="bg-cream-200 h-px flex-1" />
        {t("or")}
        <span className="bg-cream-200 h-px flex-1" />
      </div>

      {magicState?.ok ? (
        <Alert tone="success">{t("magicSent")}</Alert>
      ) : (
        <form action={magicAction} className="flex flex-col gap-3" noValidate>
          {m.form && <Alert tone="danger">{m.form}</Alert>}
          <Field id="magic-email" label={t("email")} error={m.field("email")}>
            <Input name="email" type="email" autoComplete="email" inputMode="email" required />
          </Field>
          <Button type="submit" variant="secondary" block loading={magicPending}>
            {t("magic")}
          </Button>
        </form>
      )}

      <p className="text-center text-sm">
        <span className="text-muted">{t("noAccount")} </span>
        <Link href="/registro" className="text-primary font-semibold underline-offset-4 hover:underline">
          {t("create")}
        </Link>
      </p>
    </div>
  );
}

export function SignupForm() {
  const t = useTranslations("auth.signup");
  const [state, action, pending] = useActionState<AuthState, FormData>(signUpOwnerAction, null);
  const e = useErrors(state);

  if (state?.ok) return <Alert tone="success">{t("sent")}</Alert>;

  return (
    <form action={action} className="flex flex-col gap-4" noValidate>
      {e.form && <Alert tone="danger">{e.form}</Alert>}
      <Field id="email" label={t("email")} error={e.field("email")}>
        <Input name="email" type="email" autoComplete="email" inputMode="email" required />
      </Field>
      <Field id="password" label={t("password")} hint={t("passwordHint")} error={e.field("password")}>
        <Input name="password" type="password" autoComplete="new-password" required minLength={8} />
      </Field>
      <Button type="submit" size="lg" block loading={pending}>
        {t("submit")}
      </Button>
      <p className="text-muted text-xs">{t("terms")}</p>
      <p className="text-center text-sm">
        <span className="text-muted">{t("haveAccount")} </span>
        <Link href="/entrar" className="text-primary font-semibold underline-offset-4 hover:underline">
          {t("enter")}
        </Link>
      </p>
    </form>
  );
}
