import { cn } from "@/lib/utils";

/** Marca de Repite: un sello que da la vuelta (volver, repetir). */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn("size-8", className)}>
      <rect width="32" height="32" rx="9" fill="currentColor" />
      <path d="M22.6 12.2A7.6 7.6 0 1 0 23.6 17" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" />
      <path
        d="M23.8 7.6v4.8h-4.8"
        fill="none"
        stroke="#fff"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="16" cy="16" r="2.7" fill="#fff" />
    </svg>
  );
}

export function Logo({ className, tone = "primary" }: { className?: string; tone?: "primary" | "light" }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark
        className={
          tone === "light"
            ? "text-white [&_circle]:fill-blue-800 [&_path]:stroke-blue-800 [&_rect]:fill-white"
            : "text-primary"
        }
      />
      <span className={cn("font-display text-2xl font-extrabold", tone === "light" ? "text-white" : "text-primary")}>
        Repite
      </span>
    </span>
  );
}
