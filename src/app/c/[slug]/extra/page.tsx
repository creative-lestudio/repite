import { Camera, ExternalLink, Star } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Alert, Badge, Button } from "@/components/ui";
import { BonusForm } from "@/components/customer/bonus-form";
import { planSpec } from "@/domain/plan";
import { requireCustomer } from "@/server/auth/require-customer";
import { getCardState } from "@/server/repositories/customers";

export default async function ExtraPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { location, customer } = await requireCustomer(slug);
  const [t, state] = await Promise.all([getTranslations("customer.extra"), getCardState(customer.id, location.id)]);
  const program = state.program;
  const pending = (type: string) => state.pending_bonuses.some((b) => b.type === type);
  const handle = location.settings.instagram_handle;
  const reviewUrl = location.settings.google_review_url;

  if (!planSpec(location.plan).bonuses || !program || (!program.bonus_story_enabled && !program.bonus_review_enabled)) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="text-2xl font-extrabold">{t("title")}</h1>
        <Alert tone="info">{t("disabled")}</Alert>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-extrabold">{t("title")}</h1>
      <p className="text-muted">{t("intro", { location: location.name })}</p>

      {program.bonus_story_enabled && (
        <section
          aria-labelledby="story"
          className="bg-surface shadow-card ring-cream-100 flex flex-col gap-3 rounded-xl p-5 ring-1"
        >
          <header className="flex items-start gap-3">
            <span className="bg-primary-soft text-primary flex size-11 shrink-0 items-center justify-center rounded-full">
              <Camera className="size-6" aria-hidden />
            </span>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <h2 id="story" className="text-lg font-bold">
                  {t("storyTitle")}
                </h2>
                <Badge>{t("plusOne")}</Badge>
              </div>
              <p className="text-muted text-sm">{handle ? t("storyBody", { handle }) : t("storyBodyNoHandle")}</p>
            </div>
          </header>
          {pending("bonus_story") ? (
            <Badge tone="warning" className="self-start">
              {t("pending")}
            </Badge>
          ) : (
            <BonusForm
              slug={slug}
              type="bonus_story"
              fieldLabel={t("storyField")}
              placeholder={t("storyPlaceholder")}
            />
          )}
        </section>
      )}

      {program.bonus_review_enabled && (
        <section
          aria-labelledby="review"
          className="bg-surface shadow-card ring-cream-100 flex flex-col gap-3 rounded-xl p-5 ring-1"
        >
          <header className="flex items-start gap-3">
            <span className="bg-primary-soft text-primary flex size-11 shrink-0 items-center justify-center rounded-full">
              <Star className="size-6" aria-hidden />
            </span>
            <div className="flex-1">
              <div className="flex items-center justify-between gap-2">
                <h2 id="review" className="text-lg font-bold">
                  {t("reviewTitle")}
                </h2>
                <Badge>{t("plusOne")}</Badge>
              </div>
              <p className="text-muted text-sm">{t("reviewBody", { location: location.name })}</p>
            </div>
          </header>
          {state.review_bonus_given ? (
            <Alert tone="success">{t("reviewGiven")}</Alert>
          ) : pending("bonus_review") ? (
            <Badge tone="warning" className="self-start">
              {t("pending")}
            </Badge>
          ) : (
            <>
              {reviewUrl && (
                <Button asChild variant="soft" block>
                  <a href={reviewUrl} target="_blank" rel="noopener noreferrer">
                    {t("reviewOpen")}
                    <ExternalLink aria-hidden />
                  </a>
                </Button>
              )}
              <BonusForm
                slug={slug}
                type="bonus_review"
                fieldLabel={t("reviewField")}
                placeholder={t("reviewPlaceholder")}
              />
            </>
          )}
        </section>
      )}
    </div>
  );
}
