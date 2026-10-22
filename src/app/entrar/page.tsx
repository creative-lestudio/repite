import { getTranslations } from "next-intl/server";
import { AuthShell } from "@/components/owner/auth-shell";
import { LoginForm } from "@/components/owner/auth-forms";
import { safeNext } from "@/lib/schemas/auth";

export const metadata = { title: "Entrar", robots: { index: false } };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ siguiente?: string; error?: string }>;
}) {
  const [t, sp] = await Promise.all([getTranslations("auth.login"), searchParams]);
  return (
    <AuthShell title={t("title")} subtitle={t("subtitle")}>
      <LoginForm next={safeNext(sp.siguiente)} linkError={sp.error === "enlace"} />
    </AuthShell>
  );
}
