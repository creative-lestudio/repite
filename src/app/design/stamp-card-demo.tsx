"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { StampCard } from "@/components/stamp-card/stamp-card";
import { Button } from "@/components/ui";

export function StampCardDemo() {
  const t = useTranslations("design");
  const [filled, setFilled] = useState(3);
  const [fresh, setFresh] = useState<number | null>(null);
  const total = 8;

  return (
    <div className="flex flex-col gap-3 sm:max-w-sm">
      <StampCard
        total={total}
        filled={filled}
        newStamp={fresh}
        rewardName="Un café gratis"
        locationName="Café Aurora"
      />
      <div className="flex gap-2">
        <Button
          onClick={() => {
            const next = Math.min(filled + 1, total);
            setFilled(next);
            setFresh(next);
          }}
          disabled={filled >= total}
        >
          {t("addStamp")}
        </Button>
        <Button
          variant="ghost"
          onClick={() => {
            setFilled(0);
            setFresh(null);
          }}
        >
          {t("reset")}
        </Button>
      </div>
    </div>
  );
}
