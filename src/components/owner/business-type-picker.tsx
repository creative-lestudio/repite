"use client";

import { useTranslations } from "next-intl";
import { SectorIcon } from "@/components/sector-icon";
import { BUSINESS_TYPES, type BusinessType } from "@/domain/business-types";
import { cn } from "@/lib/utils";

/** Selector de tipo de negocio: tarjetas con icono. Es un grupo de radios accesible con teclado. */
export function BusinessTypePicker({
  value,
  onChange,
  name = "businessType",
}: {
  value: BusinessType;
  onChange: (value: BusinessType) => void;
  name?: string;
}) {
  const t = useTranslations("sectors");
  return (
    <div className="grid grid-cols-2 gap-3">
      {BUSINESS_TYPES.map((type) => (
        <label key={type} className="relative cursor-pointer">
          <input
            type="radio"
            name={name}
            value={type}
            checked={value === type}
            onChange={() => onChange(type)}
            className="peer sr-only"
          />
          <span
            className={cn(
              "bg-surface flex min-h-24 flex-col items-center justify-center gap-2 rounded-xl border-2 p-3 text-center font-semibold transition-colors",
              "peer-focus-visible:ring-primary peer-focus-visible:ring-4 peer-focus-visible:ring-offset-2",
              value === type
                ? "border-primary bg-primary-soft text-wine-800"
                : "border-border text-foreground hover:border-red-600/50",
            )}
          >
            <SectorIcon sector={type} className="size-7" aria-hidden />
            {t(`${type}.name`)}
          </span>
        </label>
      ))}
    </div>
  );
}
