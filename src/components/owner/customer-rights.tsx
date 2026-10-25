"use client";

import { Download } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button, Checkbox } from "@/components/ui";
import { useToast } from "@/components/staff/toaster";
import { eraseCustomerAction } from "@/server/actions/owner";

/** Derechos del cliente: descargar sus datos y borrarlos (anonimizar). Solo para dueño y responsables. */
export function CustomerRights({ customerId }: { customerId: string }) {
  const t = useTranslations("owner.customers.rights");
  const te = useTranslations("errors");
  const router = useRouter();
  const toast = useToast();
  const [sure, setSure] = useState(false);
  const [pending, start] = useTransition();

  return (
    <div className="flex flex-col gap-4">
      <p className="text-muted text-sm">{t("intro")}</p>
      <Button asChild variant="secondary" className="self-start">
        <a href={`/app/clientes/${customerId}/datos`} download>
          <Download aria-hidden />
          {t("download")}
        </a>
      </Button>
      <div className="border-cream-200 flex flex-col gap-3 border-t pt-4">
        <p className="text-sm">{t("eraseBody")}</p>
        <Checkbox id="erase-sure" checked={sure} onChange={(e) => setSure(e.target.checked)} label={t("sure")} />
        <Button
          variant="danger"
          className="self-start"
          disabled={!sure}
          loading={pending}
          onClick={() =>
            start(async () => {
              const r = await eraseCustomerAction(customerId);
              if (r.ok) {
                toast({ tone: "success", text: t("done") });
                router.push("/app/clientes");
              } else toast({ tone: "danger", text: te(r.error as never) });
            })
          }
        >
          {t("erase")}
        </Button>
      </div>
    </div>
  );
}
