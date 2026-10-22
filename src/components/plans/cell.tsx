"use client";

import { Check, Minus } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Cell } from "@/config/plan";

/** Valor de una función en un plan: ✓, —, un número o un texto corto. */
export function CellValue({ value, className }: { value: Cell; className?: string }) {
  const t = useTranslations("plans.values");
  if (value === true)
    return (
      <span className={className}>
        <Check className="text-success mx-auto size-5" aria-hidden />
        <span className="sr-only">{t("yes")}</span>
      </span>
    );
  if (value === false)
    return (
      <span className={className}>
        <Minus className="mx-auto size-5 text-stone-400" aria-hidden />
        <span className="sr-only">{t("no")}</span>
      </span>
    );
  if (value === "unlimited") return <span className={className}>{t("unlimited")}</span>;
  if (typeof value === "number") return <span className={className}>{value}</span>;
  return <span className={className}>{t(value as never)}</span>;
}
