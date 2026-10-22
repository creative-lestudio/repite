import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { BusinessForm } from "@/components/owner/business-form";
import { createUserClient } from "@/lib/supabase/server";
import { getOwnerContext } from "@/server/auth/owner";
import { signOutOwnerAction } from "@/server/actions/auth";
import { Button } from "@/components/ui";

export const metadata = { title: "Empezar", robots: { index: false } };

export default async function StartPage() {
  if (await getOwnerContext()) redirect("/app");
  const supabase = await createUserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const t = await getTranslations("owner.start");
  const ta = await getTranslations("auth");

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col px-4 py-8">
      <p className="font-display text-primary mb-8 text-xl font-extrabold">Repite</p>
      <h1 className="text-3xl font-extrabold">{t("title")}</h1>
      <p className="text-muted mt-2 mb-6">{t("subtitle")}</p>
      <div className="bg-surface shadow-card rounded-xl p-5 ring-1 ring-blue-100">
        <BusinessForm />
      </div>
      <form action={signOutOwnerAction} className="mt-6 flex flex-col items-center gap-1">
        <p className="text-muted text-sm">{t("signedAs", { email: user?.email ?? "" })}</p>
        <Button type="submit" variant="ghost" size="sm">
          {ta("signOut")}
        </Button>
      </form>
    </main>
  );
}
