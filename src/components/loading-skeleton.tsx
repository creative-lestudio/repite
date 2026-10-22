/** Esqueleto que aparece al instante mientras carga una sección: la navegación se siente inmediata. */
export function LoadingSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div role="status" aria-busy="true" aria-live="polite" className="flex animate-pulse flex-col gap-4">
      <span className="sr-only">Cargando…</span>
      <div className="bg-cream-200 h-8 w-2/3 max-w-xs rounded-lg" />
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="bg-cream-100 h-24 rounded-xl" />
      ))}
    </div>
  );
}
