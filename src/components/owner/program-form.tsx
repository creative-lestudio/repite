"use client";

import { useActionState, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { StampCard } from "@/components/stamp-card/stamp-card";
import { Alert, Button, Checkbox, Field, Input, Textarea } from "@/components/ui";
import { saveProgramAction, type FormState } from "@/server/actions/owner";
import { useToast } from "@/components/staff/toaster";

interface Program {
  stamps_required: number;
  reward_name: string;
  reward_description: string | null;
  reward_expiry_days: number | null;
  bonus_story_enabled: boolean;
  bonus_review_enabled: boolean;
}

export function ProgramForm({
  program,
  locationName,
  sector,
}: {
  program: Program;
  locationName: string;
  sector: string;
}) {
  const t = useTranslations("owner.program");
  const te = useTranslations("errors");
  const toast = useToast();
  const [state, action, pending] = useActionState<FormState, FormData>(saveProgramAction, null);
  const [stamps, setStamps] = useState(program.stamps_required);
  const [reward, setReward] = useState(program.reward_name);

  useEffect(() => {
    if (state?.ok) toast({ tone: "success", text: t("saved") });
  }, [state, toast, t]);

  const fields = state && !state.ok ? (state.fields ?? {}) : {};
  const err = (n: string) => (fields[n] ? te(fields[n] as never) : undefined);
  const safeStamps = Number.isFinite(stamps) ? Math.min(30, Math.max(3, stamps)) : 8;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start">
      <form
        action={action}
        className="bg-surface shadow-card flex flex-col gap-5 rounded-xl p-5 ring-1 ring-blue-100"
        noValidate
      >
        {state && !state.ok && state.error !== "form" && <Alert tone="danger">{te(state.error as never)}</Alert>}
        <Field id="stamps" label={t("stamps")} error={err("stamps")}>
          <Input
            name="stamps"
            type="number"
            inputMode="numeric"
            min={3}
            max={30}
            value={Number.isNaN(stamps) ? "" : stamps}
            onChange={(e) => setStamps(e.target.valueAsNumber)}
            required
          />
        </Field>
        <Field id="rewardName" label={t("reward")} error={err("rewardName")}>
          <Input name="rewardName" value={reward} onChange={(e) => setReward(e.target.value)} maxLength={80} required />
        </Field>
        <Field id="rewardDescription" label={t("rewardDescription")} hint={t("rewardDescriptionHint")}>
          <Textarea
            name="rewardDescription"
            defaultValue={program.reward_description ?? ""}
            maxLength={200}
            className="min-h-20"
          />
        </Field>
        <Field id="expiryDays" label={t("expiry")} hint={t("expiryHint")} error={err("expiryDays")}>
          <Input
            name="expiryDays"
            type="number"
            inputMode="numeric"
            min={1}
            max={730}
            defaultValue={program.reward_expiry_days ?? ""}
          />
        </Field>
        <fieldset className="flex flex-col gap-1">
          <legend className="font-display text-lg font-bold">{t("bonusTitle")}</legend>
          <p className="text-muted mb-1 text-sm">{t("bonusHint")}</p>
          <Checkbox
            id="bonusStory"
            name="bonusStory"
            defaultChecked={program.bonus_story_enabled}
            label={t("bonusStory")}
          />
          <Checkbox
            id="bonusReview"
            name="bonusReview"
            defaultChecked={program.bonus_review_enabled}
            label={t("bonusReview")}
          />
        </fieldset>
        <Alert tone="info">{t("warning")}</Alert>
        <Button type="submit" size="lg" loading={pending}>
          {t("save")}
        </Button>
      </form>

      <aside aria-labelledby="preview" className="flex flex-col gap-3 lg:sticky lg:top-6">
        <h2 id="preview" className="text-lg font-bold">
          {t("previewTitle")}
        </h2>
        <StampCard
          total={safeStamps}
          filled={Math.min(3, safeStamps - 1)}
          rewardName={reward || "…"}
          locationName={locationName}
          sector={sector}
        />
        <p className="text-muted text-sm">{t("previewFilled", { count: Math.min(3, safeStamps - 1) })}</p>
      </aside>
    </div>
  );
}
