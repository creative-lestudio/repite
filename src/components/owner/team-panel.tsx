"use client";

import { Copy, Tablet, UserPlus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Alert, Badge, Button, Card, Field, Input } from "@/components/ui";
import { useToast } from "@/components/staff/toaster";
import {
  addStaffAction,
  changePinAction,
  createDeviceAction,
  revokeDeviceAction,
  setStaffActiveAction,
} from "@/server/actions/team";
import type { FormState } from "@/server/actions/owner";

const selectClass =
  "min-h-12 w-full rounded-lg border border-input bg-surface px-3 text-base focus-visible:border-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-primary/25";

export function AddStaffForm() {
  const t = useTranslations("owner.team");
  const te = useTranslations("errors");
  const toast = useToast();
  const [state, action, pending] = useActionState<FormState, FormData>(addStaffAction, null);
  const [key, setKey] = useState(0);

  useEffect(() => {
    if (state?.ok) {
      toast({ tone: "success", text: t("added") });
      setKey((k) => k + 1); // limpia el formulario
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const fields = state && !state.ok ? (state.fields ?? {}) : {};
  const err = (n: string) => (fields[n] ? te(fields[n] as never) : undefined);

  const planLimit = state && !state.ok && state.error === "planLimit";

  return (
    <form key={key} action={action} className="grid gap-4 sm:grid-cols-2" noValidate>
      {planLimit && (
        <Alert tone="warning" className="sm:col-span-2">
          {te("planLimit")}{" "}
          <Link href="/app/plan" className="font-semibold underline">
            {t("seePlans")}
          </Link>
        </Alert>
      )}
      <Field id="staff-name" label={t("name")} error={err("name")}>
        <Input name="name" maxLength={60} autoComplete="off" required />
      </Field>
      <Field id="staff-role" label={t("role")}>
        <select name="role" defaultValue="staff" className={selectClass}>
          <option value="staff">{t("roles.staff")}</option>
          <option value="manager">{t("roles.manager")}</option>
        </select>
      </Field>
      <Field id="staff-pin" label={t("pin")} hint={t("pinHint")} error={err("pin")} className="sm:col-span-2">
        <Input name="pin" inputMode="numeric" pattern="[0-9]*" maxLength={6} autoComplete="off" required />
      </Field>
      <Button type="submit" loading={pending} className="sm:col-span-2 sm:justify-self-start">
        <UserPlus aria-hidden />
        {t("add")}
      </Button>
    </form>
  );
}

export function StaffRow({
  member,
}: {
  member: { id: string; name: string; role: "manager" | "staff"; active: boolean; locked: boolean };
}) {
  const t = useTranslations("owner.team");
  const te = useTranslations("errors");
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [editing, setEditing] = useState(false);
  const [pin, setPin] = useState("");

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>, okText: string) =>
    start(async () => {
      const r = await fn();
      if (r.ok) {
        toast({ tone: "success", text: okText });
        setEditing(false);
        setPin("");
      } else toast({ tone: "danger", text: te((r.error ?? "generic") as never) });
      router.refresh();
    });

  return (
    <li className="flex flex-col gap-3 px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="bg-primary-soft text-primary font-display flex size-10 shrink-0 items-center justify-center rounded-full font-bold">
          {member.name.charAt(0).toUpperCase()}
        </span>
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-semibold">{member.name}</span>
          <span className="text-muted text-sm">{t(`roles.${member.role}`)}</span>
        </div>
        {member.locked && <Badge tone="warning">{t("locked")}</Badge>}
        <Badge tone={member.active ? "success" : "neutral"}>{member.active ? t("active") : t("deactivated")}</Badge>
        <div className="flex gap-2">
          {member.active && (
            <Button variant="secondary" size="sm" onClick={() => setEditing((v) => !v)} aria-expanded={editing}>
              {t("changePin")}
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            loading={pending && !editing}
            onClick={() =>
              run(() => setStaffActiveAction(member.id, !member.active), member.active ? t("deactivated") : t("active"))
            }
          >
            {member.active ? t("deactivate") : t("reactivate")}
          </Button>
        </div>
      </div>
      {editing && (
        <form
          className="flex flex-wrap items-end gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            run(() => changePinAction(member.id, pin), t("pinSaved"));
          }}
        >
          <Field id={`pin-${member.id}`} label={t("pin")} hint={t("pinHint")} className="min-w-40 flex-1">
            <Input
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              maxLength={6}
              autoComplete="off"
              autoFocus
            />
          </Field>
          <Button type="submit" loading={pending} disabled={pin.length < 4}>
            {t("changePin")}
          </Button>
        </form>
      )}
    </li>
  );
}

export function DevicesPanel({
  devices,
}: {
  devices: { id: string; name: string; last_seen_at: string | null; revoked_at: string | null }[];
}) {
  const t = useTranslations("owner.team");
  const te = useTranslations("errors");
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();
  const [name, setName] = useState("");
  const [created, setCreated] = useState<{ link: string; qr: string } | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <form
        className="flex flex-wrap items-end gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          start(async () => {
            const r = await createDeviceAction(name || t("tabletPlaceholder"));
            if (r.ok) {
              setCreated({ link: r.link, qr: r.qr });
              setName("");
              router.refresh();
            } else toast({ tone: "danger", text: te((r.error === "planLimit" ? "planLimit" : "generic") as never) });
          });
        }}
      >
        <Field id="device-name" label={t("tabletName")} className="min-w-52 flex-1">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={t("tabletPlaceholder")}
            maxLength={60}
          />
        </Field>
        <Button type="submit" loading={pending}>
          <Tablet aria-hidden />
          {t("addTablet")}
        </Button>
      </form>

      {created && (
        <Alert tone="success" title={t("tabletReady")}>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-start">
            <div
              className="w-40 shrink-0 rounded-lg bg-white p-2 [&_svg]:h-auto [&_svg]:w-full"
              role="img"
              aria-label={t("tabletLink")}
              dangerouslySetInnerHTML={{ __html: created.qr }}
            />
            <div className="flex min-w-0 flex-col gap-2">
              <p>{t("tabletOnce")}</p>
              <p className="bg-surface rounded-md p-2 font-mono text-xs break-all">{created.link}</p>
              <Button
                size="sm"
                variant="secondary"
                className="self-start"
                onClick={async () => {
                  await navigator.clipboard?.writeText(created.link).catch(() => {});
                  toast({ tone: "success", text: t("copied") });
                }}
              >
                <Copy aria-hidden />
                {t("copy")}
              </Button>
            </div>
          </div>
        </Alert>
      )}

      {devices.length === 0 ? (
        <p className="text-muted text-sm">{t("tabletsEmpty")}</p>
      ) : (
        <ul className="bg-surface shadow-card divide-cream-100 ring-cream-100 divide-y rounded-xl ring-1">
          {devices.map((d) => (
            <li key={d.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
              <Tablet className="text-primary size-6 shrink-0" aria-hidden />
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-semibold">{d.name}</span>
                <span className="text-muted text-sm">
                  {d.last_seen_at
                    ? t("lastSeen", { when: new Date(d.last_seen_at).toLocaleDateString("es-ES") })
                    : t("neverSeen")}
                </span>
              </div>
              {d.revoked_at ? (
                <Badge tone="neutral">{t("revoked")}</Badge>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    start(async () => {
                      await revokeDeviceAction(d.id);
                      router.refresh();
                    })
                  }
                >
                  {t("revoke")}
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function TeamCard({ children }: { children: React.ReactNode }) {
  return <Card className="flex flex-col gap-4">{children}</Card>;
}
