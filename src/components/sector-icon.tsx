import { Check, Coffee, IceCreamCone, Utensils, type LucideProps } from "lucide-react";
import { asBusinessType, type BusinessType } from "@/domain/business-types";

const ICONS = {
  cafeteria: Coffee,
  restaurante: Utensils,
  heladeria: IceCreamCone,
  otro: Check,
} as const;

/** Icono del sello según el tipo de negocio. */
export function SectorIcon({ sector, ...props }: { sector?: BusinessType | string | null } & LucideProps) {
  const Icon = ICONS[asBusinessType(sector)];
  return <Icon {...props} />;
}
