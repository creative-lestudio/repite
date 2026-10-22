"use client";

import { Delete, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Alert, Button, EmptyState } from "@/components/ui";
import { signInStaffAction, type PinResult } from "@/server/actions/staff";
import { cn } from "@/lib/utils";

const PIN_MAX = 6;

export function StaffSignIn({ staff }: { staff: { id: string; name: string }[] }) {
  const t = useTranslations("staff.signIn");
  const router = useRouter();
  const [selected, setSelected] = useState<{ id: string; name: string } | null>(staff.length === 1 ? staff[0] : null);
  const [pin, setPin] = useState("");
  const [result, setResult] = useState<PinResult | null>(null);
  const [pending, start] = useTransition();

  const submit = (value: string) =>
    start(async () => {
      const r = await signInStaffAction({ staffId: selected!.id, pin: value });
      setResult(r);
      setPin("");
      if (r.ok) router.refresh();
    });

  const press = (d: string) => {
    if (pending) return;
    setResult(null);
    setPin((p) => (p.length < PIN_MAX ? p + d : p));
  };

  // Teclado físico también funciona
  useEffect(() => {
    if (!selected) return;
    const onKey = (e: KeyboardEvent) => {
      if (/^\d$/.test(e.key)) press(e.key);
      else if (e.key === "Backspace") setPin((p) => p.slice(0, -1));
      else if (e.key === "Enter" && pin.length >= 4) submit(pin);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (staff.length === 0) {
    return <EmptyState className="mt-8" icon={<Users />} title={t("emptyTitle")} description={t("emptyBody")} />;
  }

  if (!selected) {
    return (
      <section aria-labelledby="who" className="mt-4 flex flex-col gap-4">
        <div>
          <h1 id="who" className="text-2xl font-extrabold">
            {t("title")}
          </h1>
          <p className="text-muted">{t("subtitle")}</p>
        </div>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {staff.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => setSelected(s)}
                className="bg-surface shadow-card hover:ring-primary ring-cream-100 flex min-h-24 w-full flex-col items-center justify-center gap-2 rounded-xl p-3 ring-1"
              >
                <span className="bg-primary-soft text-primary font-display flex size-11 items-center justify-center rounded-full text-lg font-extrabold">
                  {s.name.charAt(0)}
                </span>
                <span className="font-semibold">{s.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    );
  }

  const message =
    result && !result.ok
      ? result.reason === "wrong_pin"
        ? t("wrong", { count: result.attemptsLeft })
        : result.reason === "locked"
          ? t("locked", {
              time: new Date(result.until).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" }),
            })
          : result.reason === "rate_limited"
            ? t("rateLimited")
            : t("inactive")
      : null;

  return (
    <section aria-labelledby="pin-title" className="mx-auto mt-4 flex w-full max-w-xs flex-col items-center gap-5">
      <h1 id="pin-title" className="text-2xl font-extrabold">
        {t("pinFor", { name: selected.name })}
      </h1>
      <div role="status" aria-label={t("pinLabel")} className="flex gap-3" aria-live="polite">
        {Array.from({ length: Math.max(4, pin.length) }, (_, i) => (
          <span
            key={i}
            className={cn(
              "size-4 rounded-full border-2",
              i < pin.length ? "bg-primary border-primary" : "border-cream-200",
            )}
          />
        ))}
      </div>
      {message && (
        <Alert tone="danger" className="w-full">
          {message}
        </Alert>
      )}
      <div className="grid w-full grid-cols-3 gap-3">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((d) => (
          <PinKey key={d} label={d} aria={t("digit", { n: d })} onPress={() => press(d)} />
        ))}
        <button
          type="button"
          onClick={() => setPin((p) => p.slice(0, -1))}
          aria-label={t("delete")}
          className="text-muted hover:bg-cream-100 flex min-h-16 items-center justify-center rounded-xl"
        >
          <Delete className="size-7" aria-hidden />
        </button>
        <PinKey label="0" aria={t("digit", { n: "0" })} onPress={() => press("0")} />
        <span />
      </div>
      <Button size="lg" block disabled={pin.length < 4} loading={pending} onClick={() => submit(pin)}>
        {t("enter")}
      </Button>
      {staff.length > 1 && (
        <Button
          variant="ghost"
          onClick={() => {
            setSelected(null);
            setPin("");
            setResult(null);
          }}
        >
          {t("change", { name: selected.name })}
        </Button>
      )}
    </section>
  );
}

function PinKey({ label, aria, onPress }: { label: string; aria: string; onPress: () => void }) {
  return (
    <button
      type="button"
      onClick={onPress}
      aria-label={aria}
      className="bg-surface shadow-card font-display ring-cream-100 hover:bg-cream-50 active:bg-cream-100 min-h-16 rounded-xl text-2xl font-bold ring-1"
    >
      {label}
    </button>
  );
}
