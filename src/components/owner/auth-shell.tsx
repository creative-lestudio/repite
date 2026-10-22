import Link from "next/link";
import { Logo } from "@/components/brand/logo";

/** Marco común de entrar / registro: logotipo, título y contenido centrado. */
export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-4 py-8">
      <Link href="/" className="mb-8 inline-block" aria-label="Repite, inicio">
        <Logo />
      </Link>
      <h1 className="text-3xl font-extrabold">{title}</h1>
      <p className="text-muted mt-2 mb-6">{subtitle}</p>
      <div className="bg-surface shadow-card rounded-xl p-5 ring-1 ring-blue-100">{children}</div>
    </main>
  );
}
