import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { firstName } from "@/domain/templates";
import { LiveCard } from "@/components/customer/live-card";
import { SignupForm } from "@/components/customer/signup-form";
import { getCustomerFromSession } from "@/server/auth/customer-session";
import { getCardState } from "@/server/repositories/customers";
import { getActiveProgram, getLocationBySlug } from "@/server/repositories/locations";
import { qrSvg } from "@/server/qr";
import { brandAssets } from "@/server/brand-assets";
import { walletAvailability } from "@/server/wallet/config";
import { appUrl } from "@/server/app-url";

export default async function CustomerHome({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ bienvenida?: string }>;
}) {
  const { slug } = await params;
  const location = await getLocationBySlug(slug);
  if (!location) notFound();
  const customer = await getCustomerFromSession(location.organizationId);

  if (!customer) {
    const t = await getTranslations("customer.signup");
    const program = await getActiveProgram(location);
    return (
      <div className="flex flex-col gap-6 pt-2">
        <div>
          <h1 className="text-2xl font-extrabold">{t("title", { location: location.name })}</h1>
          <p className="text-muted mt-2">
            {program ? t("subtitle", { reward: program.reward_name.toLowerCase() }) : t("subtitleNoProgram")}
          </p>
        </div>
        <SignupForm slug={slug} locationName={location.name} />
      </div>
    );
  }

  const [state, svg] = await Promise.all([
    getCardState(customer.id, location.id),
    qrSvg(`${await appUrl()}/equipo/q/${customer.qr_token}`),
  ]);
  const { bienvenida } = await searchParams;

  return (
    <LiveCard
      slug={slug}
      customerName={firstName(customer.name)}
      sector={location.businessType}
      qrSvg={svg}
      initial={state}
      welcome={bienvenida === "1"}
      wallet={walletAvailability()}
      cardTone={location.brand.cardStyle}
      cardBrand={{
        stampShape: location.brand.stampShape,
        stampMode: location.brand.stampMode,
        stampImageUrl: brandAssets(location.brand).stampImageUrl,
        cardBgUrl: brandAssets(location.brand).cardBgUrl,
      }}
    />
  );
}
