"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Alert, Button, Field, Input } from "@/components/ui";
import {
  googleSignInAction,
  loginAction,
  magicLinkAction,
  signUpOwnerAction,
  type AuthState,
} from "@/server/actions/auth";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.7v3h3.9c2.3-2.1 3.5-5.2 3.5-8.9Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24Z"
      />
      <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6H1.3a12 12 0 0 0 0 10.8l4-3.1Z" />
      <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.8 3.6-4.9 6.7-4.9Z" />
    </svg>
  );
}

function GoogleButton({ next, label }: { next: string; label: string }) {
  return (
    <form action={googleSignInAction.bind(null, next)}>
      <Button type="submit" variant="secondary" size="lg" block>
        <GoogleIcon />
        {label}
      </Button>
    </form>
  );
}

function Divider({ text }: { text: string }) {
  return (
    <div className="text-muted flex items-center gap-3 text-sm" aria-hidden>
      <span className="bg-cream-200 h-px flex-1" />
      {text}
      <span className="bg-cream-200 h-px flex-1" />
    </div>
  );
}

function useErrors(state: AuthState) {
  const te = useTranslations("errors");
  const fields = state && !state.ok && state.fields ? state.fields : {};
  return {
    field: (name: string) => (fields[name] ? te(fields[name] as never) : undefined),
    form: state && !state.ok && state.error !== "form" ? te(state.error as never) : null,
  };
}

function EmailLinkForm({
  action,
  label,
  sentText,
}: {
  action: (prev: AuthState, formData: FormData) => Promise<AuthState>;
  label: string;
  sentText: string;
}) {
  const t = useTranslations("auth");
  const [state, formAction, pending] = useActionState<AuthState, FormData>(action, null);
  const e = useErrors(state);

  if (state?.ok) return <Alert tone="success">{sentText}</Alert>;
  return (
    <form action={formAction} className="flex flex-col gap-4" noValidate>
      {e.form && <Alert tone="danger">{e.form}</Alert>}
      <Field id="email" label={t("email")} error={e.field("email")}>
        <Input name="email" type="email" autoComplete="email" inputMode="email" required />
      </Field>
      <Button type="submit" size="lg" block loading={pending}>
        {label}
      </Button>
    </form>
  );
}

export function LoginForm({ next, linkError }: { next: string; linkError: boolean }) {
  const t = useTranslations("auth.login");
  const [state, action, pending] = useActionState<AuthState, FormData>(loginAction.bind(null, next), null);
  const e = useErrors(state);

  return (
    <div className="flex flex-col gap-5">
      {linkError && <Alert tone="warning">{t("linkError")}</Alert>}
      <GoogleButton next={next} label={t("google")} />
      <Divider text={t("orEmail")} />
      <EmailLinkForm action={magicLinkAction.bind(null, next)} label={t("magic")} sentText={t("magicSent")} />

      <details className="group text-sm">
        <summary className="text-muted min-h-11 cursor-pointer py-3 text-center font-medium underline-offset-4 hover:underline">
          {t("withPassword")}
        </summary>
        <form action={action} className="mt-2 flex flex-col gap-4" noValidate>
          {e.form && <Alert tone="danger">{e.form}</Alert>}
          <Field id="pw-email" label={t("email")} error={e.field("email")}>
            <Input name="email" type="email" autoComplete="email" inputMode="email" required />
          </Field>
          <Field id="password" label={t("password")} error={e.field("password")}>
            <Input name="password" type="password" autoComplete="current-password" required />
          </Field>
          <Button type="submit" variant="secondary" block loading={pending}>
            {t("submit")}
          </Button>
        </form>
      </details>

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
  return (
    <div className="flex flex-col gap-5">
      <GoogleButton next="/app/empezar" label={t("google")} />
      <Divider text={t("orEmail")} />
      <EmailLinkForm action={signUpOwnerAction} label={t("submit")} sentText={t("sent")} />
      <p className="text-muted text-xs">{t("terms")}</p>
      <p className="text-center text-sm">
        <span className="text-muted">{t("haveAccount")} </span>
        <Link href="/entrar" className="text-primary font-semibold underline-offset-4 hover:underline">
          {t("enter")}
        </Link>
      </p>
    </div>
  );
}
