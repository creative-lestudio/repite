import Link from "next/link";
import { Button } from "@/components/ui";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col justify-center gap-6 px-4 py-16">
      <p className="font-display text-primary text-xl font-extrabold">Repite</p>
      <h1 className="text-3xl font-extrabold text-balance">Cada visita a tu local, el comienzo de la siguiente.</h1>
      <p className="text-muted text-lg">
        Tarjeta de sellos por QR sin apps, la memoria de cada cliente y mensajes listos para que vuelvan. Tú solo
        apruebas.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link href="/app">Crear mi cuenta gratis</Link>
        </Button>
        <Button asChild size="lg" variant="secondary">
          <Link href="/c/cafe-aurora">Ver la demo</Link>
        </Button>
      </div>
      <p className="text-muted text-sm">30 días gratis. Sin tarjeta.</p>
    </main>
  );
}
