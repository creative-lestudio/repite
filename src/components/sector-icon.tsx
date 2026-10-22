import {
  Beer,
  Cake,
  Check,
  Coffee,
  Cookie,
  Croissant,
  Donut,
  Flame,
  Heart,
  IceCreamCone,
  Pizza,
  Salad,
  Sandwich,
  Soup,
  Star,
  Utensils,
  Wine,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";
import { asBusinessType, type BusinessType } from "@/domain/business-types";
import type { StampIconKey } from "@/domain/brand";

const ICONS = {
  cafeteria: Coffee,
  restaurante: Utensils,
  heladeria: IceCreamCone,
  otro: Check,
} as const;

export const STAMP_ICON_COMPONENTS: Record<StampIconKey, LucideIcon> = {
  coffee: Coffee,
  ice: IceCreamCone,
  utensils: Utensils,
  pizza: Pizza,
  croissant: Croissant,
  cake: Cake,
  donut: Donut,
  cookie: Cookie,
  sandwich: Sandwich,
  salad: Salad,
  soup: Soup,
  beer: Beer,
  wine: Wine,
  flame: Flame,
  star: Star,
  heart: Heart,
};

/** Icono del sello: el elegido por el local o, si no hay, el del tipo de negocio. */
export function SectorIcon({
  sector,
  icon,
  ...props
}: { sector?: BusinessType | string | null; icon?: StampIconKey | null } & LucideProps) {
  const Icon = icon ? STAMP_ICON_COMPONENTS[icon] : ICONS[asBusinessType(sector)];
  return <Icon {...props} />;
}
