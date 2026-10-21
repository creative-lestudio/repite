import * as React from "react";
import { cn } from "@/lib/utils";

/** Estado vacío: qué pasa y qué hacer a continuación. */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "border-border bg-surface flex flex-col items-center gap-3 rounded-xl border border-dashed px-6 py-10 text-center",
        className,
      )}
    >
      {icon && (
        <div className="bg-primary-soft text-primary flex size-12 items-center justify-center rounded-full [&_svg]:size-6">
          {icon}
        </div>
      )}
      <p className="font-display text-foreground text-lg font-bold">{title}</p>
      {description && <p className="text-muted max-w-sm text-sm">{description}</p>}
      {action}
    </div>
  );
}
