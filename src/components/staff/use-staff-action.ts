"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";

type Result = { ok: true; data?: unknown } | { ok: false; error: string; values?: Record<string, string | number> };

/** Ejecuta una acción del equipo, traduce el error y refresca la página al terminar. */
export function useStaffAction() {
  const te = useTranslations("errors");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [feedback, setFeedback] = useState<{ tone: "success" | "danger"; text: string } | null>(null);

  function run<R extends Result>(fn: () => Promise<R>, onOk: (r: Extract<R, { ok: true }>) => string | null) {
    setFeedback(null);
    start(async () => {
      const r = await fn();
      if (r.ok) {
        const text = onOk(r as Extract<R, { ok: true }>);
        if (text) setFeedback({ tone: "success", text });
        router.refresh();
      } else {
        if (r.error === "staffSessionExpired") router.refresh();
        setFeedback({ tone: "danger", text: te(r.error as never, r.values as never) });
      }
    });
  }

  return { pending, feedback, run, setFeedback };
}
