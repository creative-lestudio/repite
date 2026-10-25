"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { StampCard } from "@/components/stamp-card/stamp-card";
import { Button } from "@/components/ui";

const TOTAL = 8;

/** Demo con datos ficticios, solo en memoria: no llama al servidor ni guarda nada. */
export function DemoCard() {
  const t = useTranslations("landing.demo");
  const [filled, setFilled] = useState(5);
  const [newStamp, setNewStamp] = useState<number | null>(null);
  const done = filled >= TOTAL;

  return (
    <div className="mx-auto flex w-full max-w-sm flex-col gap-4">
      <p role="note" className="bg-cream-100 text-wine-800 rounded-lg px-4 py-3 text-sm font-semibold">
        {t("notice")}
      </p>
      <StampCard
        total={TOTAL}
        filled={filled}
        newStamp={newStamp}
        rewardName={t("reward")}
        locationName={t("business")}
        sector="cafeteria"
      />
      <p aria-live="polite" className="text-center font-semibold">
        {done ? t("complete") : t("progress", { filled, total: TOTAL })}
      </p>
      <div className="flex flex-col gap-2">
        <Button
          size="lg"
          disabled={done}
          onClick={() => {
            const next = Math.min(TOTAL, filled + 1);
            setFilled(next);
            setNewStamp(next);
          }}
        >
          {t("add")}
        </Button>
        <Button
          variant="secondary"
          onClick={() => {
            setFilled(0);
            setNewStamp(null);
          }}
        >
          {t("reset")}
        </Button>
      </div>
    </div>
  );
}
