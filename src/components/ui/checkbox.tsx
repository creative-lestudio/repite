import * as React from "react";
import { cn } from "@/lib/utils";

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: React.ReactNode;
  description?: React.ReactNode;
}

export const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ id, label, description, className, ...props }, ref) => (
    <label htmlFor={id} className={cn("flex min-h-11 cursor-pointer items-start gap-3 py-1", className)}>
      <input
        ref={ref}
        id={id}
        type="checkbox"
        className="border-border accent-primary mt-0.5 size-6 shrink-0 cursor-pointer rounded-md"
        {...props}
      />
      <span className="flex flex-col gap-0.5">
        <span className="text-foreground text-sm">{label}</span>
        {description && <span className="text-muted text-xs">{description}</span>}
      </span>
    </label>
  ),
);
Checkbox.displayName = "Checkbox";
