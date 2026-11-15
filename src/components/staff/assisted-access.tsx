"use client";

import { KeyRound } from "lucide-react";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui";
import { createAssistedAccessAction } from "@/server/actions/staff";
import { useToast } from "./toaster";

/** El equipo da acceso a la tarjeta del cliente en otro móvil: QR y enlace de un solo uso. */
export function AssistedAccess({ customerId }: { customerId: string }) {
  const t = useTranslations("staff.customer.assisted");
  const te = useTranslations("errors");
  const toast = useToast();
  const [pending, start] = useTransition();
  const [access, setAccess] = useState<{ url: string; qr: string; minutes: number } | null>(null);

  return (
    <div className="bg-surface ring-cream-100 flex flex-col gap-3 rounded-xl p-4 ring-1">
      <h2 className="flex items-center gap-2 font-bold">
        <KeyRound className="text-primary size-5" aria-hidden />
        {t("title")}
      </h2>
      <p className="text-muted text-sm">{t("body")}</p>
      {access ? (
        <div className="flex flex-col items-center gap-3">
          <div
            role="img"
            aria-label={t("qrLabel")}
            className="w-56 max-w-full rounded-lg bg-white p-2 [&>svg]:h-auto [&>svg]:w-full"
            dangerouslySetInnerHTML={{ __html: access.qr }}
          />
          <p className="text-center text-sm font-semibold">{t("scan", { minutes: access.minutes })}</p>
          <p className="text-muted text-center text-xs">{t("oneUse")}</p>
          <Button variant="secondary" onClick={() => setAccess(null)}>
            {t("close")}
          </Button>
        </div>
      ) : (
        <Button
          variant="secondary"
          loading={pending}
          onClick={() =>
            start(async () => {
              const r = await createAssistedAccessAction(customerId);
              if (r.ok) setAccess(r.data);
              else toast({ tone: "danger", text: te(r.error as never) });
            })
          }
        >
          {t("create")}
        </Button>
      )}
    </div>
  );
}
