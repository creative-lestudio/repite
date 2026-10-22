"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useTranslations } from "next-intl";
import { useToast } from "./toaster";

type Result = { ok: true; data?: unknown } | { ok: false; error: string; values?: Record<string, string | number> };

/** Ejecuta una acción del equipo, muestra el aviso (éxito o error traducido) y refresca la página. */
export function useStaffAction() {
  const te = useTranslations("errors");
  const router = useRouter();
  const toast = useToast();
  const [pending, start] = useTransition();

  function run<R extends Result>(fn: () => Promise<R>, onOk: (r: Extract<R, { ok: true }>) => string | null) {
    start(async () => {
      const r = await fn();
      if (r.ok) {
        const text = onOk(r as Extract<R, { ok: true }>);
        if (text) toast({ tone: "success", text });
      } else {
        toast({ tone: "danger", text: te(r.error as never, r.values as never) });
      }
      router.refresh();
    });
  }

  return { pending, run };
}
