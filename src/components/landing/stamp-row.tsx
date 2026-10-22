import { cn } from "@/lib/utils";

/** Fila decorativa de sellos que se estampan en cadena (solo adorno; respeta «reducir movimiento»). */
export function StampRow({ className }: { className?: string }) {
  return (
    <div aria-hidden className={cn("flex flex-wrap gap-3", className)}>
      {Array.from({ length: 6 }, (_, i) => (
        <span
          key={i}
          style={{ animationDelay: `${i * 160}ms` }}
          className="animate-stamp flex size-11 -rotate-6 items-center justify-center rounded-full bg-red-500 text-sm font-bold text-white shadow-[inset_0_-3px_0_rgb(0_0_0/0.18)] sm:size-12"
        >
          {i + 1}
        </span>
      ))}
    </div>
  );
}
