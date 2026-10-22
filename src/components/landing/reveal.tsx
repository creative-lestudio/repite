"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/**
 * Aparece suavemente al entrar en pantalla. El contenido es visible sin JavaScript y, si la persona
 * prefiere menos movimiento, no se anima nada. Solo se oculta lo que está por debajo de la pantalla.
 */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (el.getBoundingClientRect().top < window.innerHeight) return; // ya visible
    el.style.opacity = "0";
    el.style.transform = "translateY(16px)";
    const io = new IntersectionObserver(
      (entries) => {
        if (!entries[0].isIntersecting) return;
        el.style.transition = `opacity 600ms ease-out ${delay}ms, transform 600ms ease-out ${delay}ms`;
        el.style.opacity = "1";
        el.style.transform = "none";
        io.disconnect();
      },
      { rootMargin: "0px 0px -8% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delay]);

  return (
    <div ref={ref} className={cn(className)}>
      {children}
    </div>
  );
}
