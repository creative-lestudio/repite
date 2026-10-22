import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "border-input bg-surface text-foreground placeholder:text-muted/70 min-h-12 w-full rounded-lg border px-4 text-base",
        "focus-visible:border-primary focus-visible:ring-primary/25 focus-visible:ring-3 focus-visible:outline-none",
        "aria-invalid:border-danger aria-invalid:ring-danger/20 disabled:opacity-60",
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "border-input bg-surface text-foreground placeholder:text-muted/70 min-h-24 w-full rounded-lg border px-4 py-3 text-base",
        "focus-visible:border-primary focus-visible:ring-primary/25 focus-visible:ring-3 focus-visible:outline-none",
        "aria-invalid:border-danger",
        className,
      )}
      {...props}
    />
  ),
);
Textarea.displayName = "Textarea";
