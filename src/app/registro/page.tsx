import { getTranslations } from "next-intl/server";
import { AuthShell } from "@/components/owner/auth-shell";
import { SignupForm } from "@/components/owner/auth-forms";

export const metadata = { title: "Crear cuenta", description: "30 días gratis, sin tarjeta." };

export default async function SignupPage() {
  const t = await getTranslations("auth.signup");
  return (
    <AuthShell title={t("title")} subtitle={t("subtitle")}>
      <SignupForm />
    </AuthShell>
  );
}
