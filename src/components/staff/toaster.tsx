"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

type Toast = { id: number; tone: "success" | "danger"; text: string };
const ToastContext = createContext<(t: Omit<Toast, "id">) => void>(() => {});

export const useToast = () => useContext(ToastContext);

/**
 * Avisos del panel del equipo. Viven en el layout para sobrevivir al refresco de la página
 * (p. ej. al canjear el último premio, la lista que contenía el botón desaparece).
 */
export function Toaster({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<Toast | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const show = useCallback((t: Omit<Toast, "id">) => {
    clearTimeout(timer.current);
    setToast({ ...t, id: Date.now() });
    timer.current = setTimeout(() => setToast(null), t.tone === "danger" ? 8000 : 5000);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        aria-live="polite"
        role="status"
        className="pointer-events-none fixed inset-x-0 bottom-20 z-20 flex justify-center px-4"
      >
        {toast && (
          <p
            key={toast.id}
            className={cn(
              "animate-fade-in pointer-events-auto flex max-w-md items-start gap-2 rounded-xl px-4 py-3 font-semibold text-white shadow-lg",
              toast.tone === "success" ? "bg-success" : "bg-danger",
            )}
          >
            {toast.tone === "success" ? (
              <CheckCircle2 className="mt-0.5 size-5 shrink-0" aria-hidden />
            ) : (
              <XCircle className="mt-0.5 size-5 shrink-0" aria-hidden />
            )}
            {toast.text}
          </p>
        )}
      </div>
    </ToastContext.Provider>
  );
}
