import { brandStyle } from "@/server/brand-assets";
import type { Brand } from "@/domain/brand";

/** Envuelve una zona de la app con los colores y la tipografía del local. */
export function BrandTheme({
  brand,
  className,
  children,
}: {
  brand: Brand;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={brandStyle(brand)} className={className}>
      {children}
    </div>
  );
}
