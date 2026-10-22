import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui";
import { InstallPrompt } from "@/components/customer/install-prompt";
import { PreferencesForm } from "@/components/customer/preferences-form";
import { PushToggle } from "@/components/customer/push-toggle";
import { planSpec } from "@/domain/plan";
import { pushConfig } from "@/server/notifications/config";
import { signOutAction } from "@/server/actions/customer";
import { requireCustomer } from "@/server/auth/require-customer";

export default async function SettingsPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { location, customer } = await requireCustomer(slug);
  const t = await getTranslations("customer.settings");

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-extrabold">{t("title")}</h1>
      <div className="bg-surface shadow-card ring-cream-100 rounded-xl p-5 ring-1">
        <PreferencesForm
          slug={slug}
          locationName={location.name}
          locale={customer.locale}
          consent={customer.marketing_consent}
        />
      </div>
      {pushConfig() && planSpec(location.plan).notifications !== 0 && (
        <PushToggle slug={slug} publicKey={pushConfig()!.publicKey} locationName={location.name} />
      )}
      <InstallPrompt />
      <form action={signOutAction.bind(null, slug)} className="flex flex-col gap-1">
        <Button type="submit" variant="ghost" block>
          {t("signOut")}
        </Button>
        <p className="text-muted text-center text-xs">{t("signOutHint")}</p>
      </form>
    </div>
  );
}
