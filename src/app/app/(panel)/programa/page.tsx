import { getTranslations } from "next-intl/server";
import { ProgramForm } from "@/components/owner/program-form";
import { planSpec } from "@/domain/plan";
import { brandAssets } from "@/server/brand-assets";
import { requireManager } from "@/server/auth/owner";
import { getProgram } from "@/server/repositories/owner";

export default async function ProgramPage() {
  const ctx = await requireManager();
  const [t, program] = await Promise.all([getTranslations("owner.program"), getProgram()]);
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-extrabold">{t("title")}</h1>
        <p className="text-muted mt-1">{t("intro")}</p>
      </div>
      <ProgramForm
        locationName={ctx.location.name}
        sector={ctx.location.businessType}
        bonusesAllowed={planSpec(ctx.organization.effectivePlan).bonuses}
        cardTone={ctx.location.brandApplied.cardStyle}
        cardBrand={{
          stampShape: ctx.location.brandApplied.stampShape,
          stampMode: ctx.location.brandApplied.stampMode,
          stampIcon: ctx.location.brandApplied.stampIcon,
          stampImageUrl: brandAssets(ctx.location.brandApplied).stampImageUrl,
          cardBgUrl: brandAssets(ctx.location.brandApplied).cardBgUrl,
        }}
        program={
          program ?? {
            stamps_required: 8,
            reward_name: "",
            reward_description: null,
            reward_expiry_days: null,
            bonus_story_enabled: true,
            bonus_review_enabled: true,
          }
        }
      />
    </div>
  );
}
