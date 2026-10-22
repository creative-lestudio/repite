import { getTranslations } from "next-intl/server";
import { BrandForm } from "@/components/owner/brand-form";
import { requireManager } from "@/server/auth/owner";
import { brandAssets } from "@/server/brand-assets";

export const metadata = { title: "Mi marca" };

export default async function BrandPage() {
  const [ctx, t] = await Promise.all([requireManager(), getTranslations("owner.brand")]);
  const assets = brandAssets(ctx.location.brand);
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold">{t("title")}</h1>
        <p className="text-muted mt-1">{t("subtitle")}</p>
      </div>
      <BrandForm
        // key: al subir o borrar una imagen se vuelve a montar con los datos nuevos
        key={`${assets.logoUrl}|${assets.stampImageUrl}|${assets.cardBgUrl}`}
        initial={ctx.location.brand}
        locationName={ctx.location.name}
        sector={ctx.location.businessType}
        logoUrl={assets.logoUrl}
        stampImageUrl={assets.stampImageUrl}
        cardBgUrl={assets.cardBgUrl}
        plan={ctx.organization.effectivePlan}
      />
    </div>
  );
}
