import { cn } from "@/lib/utils";

/** Gráfico de barras sencillo (sin librerías): la tabla oculta da los datos a lectores de pantalla. */
export function BarChart({
  data,
  label,
  valueLabel,
  className,
}: {
  data: { label: string; value: number }[];
  label: string;
  valueLabel: string;
  className?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <figure className={cn("flex flex-col gap-2", className)}>
      <div role="img" aria-label={label} className="flex h-40 items-end gap-px">
        {data.map((d) => (
          <div key={d.label} className="flex h-full min-w-0 flex-1 items-end" title={`${d.label}: ${d.value}`}>
            <div
              className="bg-brand w-full rounded-t-sm"
              style={{
                height: d.value === 0 ? "2px" : `${Math.max(4, (d.value / max) * 100)}%`,
                opacity: d.value === 0 ? 0.25 : 1,
              }}
            />
          </div>
        ))}
      </div>
      <div className="text-muted flex justify-between text-xs">
        <span>{data[0]?.label}</span>
        <span>{data[data.length - 1]?.label}</span>
      </div>
      <table className="sr-only">
        <caption>{label}</caption>
        <thead>
          <tr>
            <th scope="col">{label}</th>
            <th scope="col">{valueLabel}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((d) => (
            <tr key={d.label}>
              <th scope="row">{d.label}</th>
              <td>{d.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
