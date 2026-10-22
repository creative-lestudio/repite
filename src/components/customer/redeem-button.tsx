"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui";

/** Pantalla de canje: muestra el código del cliente a pantalla completa para que el equipo lo valide. */
export function RedeemButton({
  rewardName,
  customerName,
  qrSvg,
}: {
  rewardName: string;
  customerName: string;
  qrSvg: string;
}) {
  const t = useTranslations("customer.rewards");
  const tc = useTranslations("customer.card");
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <>
      <Button block onClick={() => setOpen(true)}>
        {t("redeem")}
      </Button>
      <dialog
        ref={dialog}
        onClose={() => setOpen(false)}
        aria-labelledby="redeem-title"
        className="bg-surface backdrop:bg-ink-950/60 m-auto w-[calc(100%-2rem)] max-w-sm rounded-xl p-6"
      >
        <div className="flex flex-col items-center gap-4 text-center">
          <h2 id="redeem-title" className="text-xl font-extrabold">
            {t("redeemTitle", { reward: rewardName.toLowerCase() })}
          </h2>
          <p className="font-display text-2xl font-extrabold">{customerName}</p>
          <div
            role="img"
            aria-label={tc("codeAlt", { name: customerName })}
            className="w-full max-w-64 [&_svg]:h-auto [&_svg]:w-full"
            dangerouslySetInnerHTML={{ __html: qrSvg }}
          />
          <p className="text-muted text-sm">{t("redeemBody")}</p>
          <Button variant="secondary" block onClick={() => setOpen(false)}>
            {t("redeemDone")}
          </Button>
        </div>
      </dialog>
    </>
  );
}
