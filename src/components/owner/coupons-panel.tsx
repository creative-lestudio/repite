"use client";

import { Pause, Play, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useToast } from "@/components/staff/toaster";
import { Alert, Badge, Button, Field, Input, Textarea } from "@/components/ui";
import { createCouponAction, deleteCouponAction, setCouponActiveAction } from "@/server/actions/coupons";
import type { CouponRow } from "@/server/repositories/owner";

const selectClass =
  "border-input bg-surface min-h-12 w-full rounded-lg border px-4 text-base focus-visible:border-primary focus-visible:ring-primary/25 focus-visible:ring-3 focus-visible:outline-none";

export function CouponForm({ locked }: { locked: boolean }) {
  const t = useTranslations("owner.coupons");
  const te = useTranslations("errors");
  const toast = useToast();
  const [state, action, pending] = useActionState(createCouponAction, null);
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (state?.ok) {
      toast({ tone: "success", text: t("created") });
      setKey((k) => k + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const fields = state && !state.ok ? (state.fields ?? {}) : {};
  const err = (n: string) => (fields[n] ? te(fields[n] as never) : undefined);
  const formError = state && !state.ok && state.error !== "form" ? te(state.error as never) : null;

  return (
    <form key={key} action={action} className="flex flex-col gap-4" noValidate>
      {formError && <Alert tone="warning">{formError}</Alert>}
      <fieldset disabled={locked} className="flex flex-col gap-4 disabled:opacity-60">
        <Field id="coupon-title" label={t("title")} error={err("title")}>
          <Input name="title" maxLength={80} placeholder={t("titlePlaceholder")} required />
        </Field>
        <Field id="coupon-desc" label={t("description")} error={err("description")}>
          <Textarea name="description" maxLength={200} className="min-h-20" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="coupon-audience" label={t("audience")}>
            <select name="audience" defaultValue="all" className={selectClass}>
              <option value="all">{t("audiences.all")}</option>
              <option value="welcome">{t("audiences.welcome")}</option>
              <option value="birthday">{t("audiences.birthday")}</option>
            </select>
          </Field>
          <Field id="coupon-ends" label={t("endsAt")} hint={t("endsAtHint")} error={err("endsAt")}>
            <Input name="endsAt" type="date" />
          </Field>
        </div>
        <Button type="submit" loading={pending} className="self-start">
          <Plus aria-hidden />
          {t("create")}
        </Button>
      </fieldset>
    </form>
  );
}

export function CouponItem({ coupon }: { coupon: CouponRow }) {
  const t = useTranslations("owner.coupons");
  const te = useTranslations("errors");
  const toast = useToast();
  const router = useRouter();
  const [pending, start] = useTransition();

  const run = (fn: () => Promise<{ ok: true } | { ok: false; error: string }>) =>
    start(async () => {
      const r = await fn();
      if (r.ok) router.refresh();
      else toast({ tone: "danger", text: te(r.error as never) });
    });

  const ended = coupon.ends_at !== null && new Date(coupon.ends_at) < new Date();

  return (
    <li className="bg-surface ring-cream-100 flex flex-col gap-3 rounded-xl p-4 ring-1">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-bold">{coupon.title}</p>
          {coupon.description && <p className="text-muted text-sm">{coupon.description}</p>}
        </div>
        <Badge tone={ended ? "neutral" : coupon.active ? "success" : "warning"}>
          {ended ? t("ended") : coupon.active ? t("active") : t("paused")}
        </Badge>
      </div>
      <p className="text-muted text-sm">
        {t(`audiences.${coupon.audience}`)} · {t("stats", { issued: coupon.issued, redeemed: coupon.redeemed })}
        {coupon.ends_at && ` · ${t("until", { date: new Date(coupon.ends_at).toLocaleDateString("es-ES") })}`}
      </p>
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="secondary"
          loading={pending}
          onClick={() => run(() => setCouponActiveAction(coupon.id, !coupon.active))}
        >
          {coupon.active ? <Pause aria-hidden /> : <Play aria-hidden />}
          {coupon.active ? t("pause") : t("resume")}
        </Button>
        <Button size="sm" variant="ghost" disabled={pending} onClick={() => run(() => deleteCouponAction(coupon.id))}>
          <Trash2 aria-hidden />
          {t("delete")}
        </Button>
      </div>
    </li>
  );
}

export function LockedNote() {
  const t = useTranslations("owner.coupons");
  return (
    <Alert tone="info">
      {t("locked")}{" "}
      <Link href="/app/plan" className="font-semibold underline">
        {t("seePlans")}
      </Link>
    </Alert>
  );
}
