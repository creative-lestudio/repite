import paths from "./paths.json";
import { cn } from "@/lib/utils";

const MARK = paths.mark;
const WORD = paths.wordmark;
const box = (b: number[]) => b.join(" ");

/** La «R» con flecha de Repite (vectorizada del tablero de identidad). Usa el color del texto. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox={box(MARK.box)}
      aria-hidden
      className={cn("h-8 w-auto", className)}
      fill="currentColor"
      fillRule="evenodd"
    >
      <path d={MARK.d} />
    </svg>
  );
}

/** Logotipo completo «Repite». Por defecto en el color del texto; usa `text-red-500`, `text-ink-950`, etc. */
export function Logo({ className, label = "Repite" }: { className?: string; label?: string }) {
  return (
    <svg
      viewBox={box(WORD.box)}
      role="img"
      aria-label={label}
      className={cn("h-7 w-auto", className)}
      fill="currentColor"
      fillRule="evenodd"
    >
      <path d={WORD.d} />
    </svg>
  );
}

/** Icono de aplicación: cuadrado redondeado rojo con la «R» en crema. */
export function AppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden className={cn("size-10", className)}>
      <rect width="100" height="100" rx="26" fill="var(--red-500)" />
      <svg x="33" y="21" width="34" height="58" viewBox={box(MARK.box)} fill="var(--cream-100)" fillRule="evenodd">
        <path d={MARK.d} />
      </svg>
    </svg>
  );
}
