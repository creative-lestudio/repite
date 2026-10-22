import { cn } from "@/lib/utils";

/** Fila decorativa de sellos que se estampan en cadena (solo adorno; respeta «reducir movimiento»). */
export function StampRow({ className, tone = "dark" }: { className?: string; tone?: "dark" | "light" }) {
  return (
    <div aria-hidden className={cn("flex flex-wrap gap-3", className)}>
      {Array.from({ length: 6 }, (_, i) => (
        <span
          key={i}
          style={{ animationDelay: `${i * 160}ms` }}
          className={cn(
            "animate-stamp flex size-11 -rotate-6 items-center justify-center rounded-full text-sm font-bold sm:size-12",
            tone === "dark" ? "bg-primary text-white" : "bg-white text-blue-800",
          )}
        >
          {i + 1}
        </span>
      ))}
    </div>
  );
}
