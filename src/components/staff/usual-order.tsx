"use client";

import { Coffee } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Input } from "@/components/ui";
import { setUsualOrderAction } from "@/server/actions/staff";
import { useStaffAction } from "./use-staff-action";

export function UsualOrder({ customerId, value }: { customerId: string; value: string | null }) {
  const t = useTranslations("staff.customer");
  const { pending, run } = useStaffAction();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value ?? "");

  return (
    <div className="flex flex-col gap-2">
      <p className="text-muted text-sm font-semibold">{t("usualOrder")}</p>
      {editing ? (
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            run(
              () => setUsualOrderAction({ customerId, usualOrder: draft }),
              () => {
                setEditing(false);
                return null;
              },
            );
          }}
        >
          <label htmlFor="usual-order" className="sr-only">
            {t("usualOrder")}
          </label>
          <Input
            id="usual-order"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t("usualOrderPlaceholder")}
            maxLength={120}
            className="min-w-0 flex-1"
            autoFocus
          />
          <Button type="submit" loading={pending}>
            {t("usualOrderSave")}
          </Button>
        </form>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <p className="flex items-center gap-2 text-lg font-semibold">
            <Coffee className="text-primary size-5" aria-hidden />
            {value || <span className="text-muted font-normal">{t("usualOrderEmpty")}</span>}
          </p>
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
            {t("usualOrderEdit")}
          </Button>
        </div>
      )}
    </div>
  );
}
