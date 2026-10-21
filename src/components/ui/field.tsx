import * as React from "react";
import { cn } from "@/lib/utils";

interface FieldProps {
  id: string;
  label: React.ReactNode;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  optionalLabel?: string;
  className?: string;
  children: React.ReactElement<React.InputHTMLAttributes<HTMLElement>>;
}

/** Etiqueta + control + ayuda + error, con los atributos ARIA conectados. */
export function Field({ id, label, hint, error, optionalLabel, className, children }: FieldProps) {
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-foreground text-sm font-semibold">
        {label}
        {optionalLabel && <span className="text-muted ml-1 font-normal">({optionalLabel})</span>}
      </label>
      {React.cloneElement(children, {
        id,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
      } as React.InputHTMLAttributes<HTMLElement>)}
      {hint && (
        <p id={hintId} className="text-muted text-sm">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-danger text-sm font-medium">
          {error}
        </p>
      )}
    </div>
  );
}
