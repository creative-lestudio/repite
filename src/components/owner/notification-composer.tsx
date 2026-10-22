"use client";

import { Bell, Save, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { useToast } from "@/components/staff/toaster";
import { Alert, Button, Card, Field, Input, Textarea } from "@/components/ui";
import type { Level } from "@/domain/levels";
import {
  BODY_MAX,
  isSegmentAllowed,
  needsValue,
  renderNotification,
  SAMPLE_VARS,
  SEGMENT_DEFAULT_VALUE,
  SEGMENT_TYPES,
  TITLE_MAX,
  VARIABLES,
  type BuiltinTemplate,
  type SegmentType,
} from "@/domain/notifications";
import {
  deleteTemplateAction,
  previewAudienceAction,
  saveTemplateAction,
  sendNotificationAction,
  type AudiencePreview,
} from "@/server/actions/notifications";
import { cn } from "@/lib/utils";

const selectClass =
  "border-input bg-surface min-h-12 w-full rounded-lg border px-4 text-base focus-visible:border-primary focus-visible:ring-primary/25 focus-visible:ring-3 focus-visible:outline-none";

interface Props {
  builtin: BuiltinTemplate[];
  custom: { id: string; name: string; title: string; body: string }[];
  levels: Level[];
  advanced: boolean;
  canSaveTemplates: boolean;
  /** Envíos que quedan este mes (null = sin límite). */
  remaining: number | null;
  locationName: string;
  channels: { apple: boolean; google: boolean; push: boolean };
}

export function NotificationComposer({
  builtin,
  custom,
  levels,
  advanced,
  canSaveTemplates,
  remaining,
  locationName,
  channels,
}: Props) {
  const t = useTranslations("owner.notifications");
  const te = useTranslations("errors");
  const toast = useToast();
  const router = useRouter();
  const bodyRef = useRef<HTMLTextAreaElement>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [segType, setSegType] = useState<SegmentType>("all");
  const [segValue, setSegValue] = useState<number>(7);
  const [preview, setPreview] = useState<AudiencePreview | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [templateName, setTemplateName] = useState("");
  const [pending, start] = useTransition();

  const exhausted = remaining !== null && remaining <= 0;
  const types = SEGMENT_TYPES.filter((s) => s !== "level" || levels.length > 0);

  // Vista previa de la audiencia al cambiar de segmento
  useEffect(() => {
    let cancelled = false;
    setLoadingPreview(true);
    const id = setTimeout(async () => {
      const r = await previewAudienceAction({ type: segType, value: needsValue(segType) ? segValue : undefined });
      if (cancelled) return;
      setPreview(r.ok ? r : null);
      setLoadingPreview(false);
    }, 350);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [segType, segValue]);

  const pickSegment = (type: SegmentType, value?: number) => {
    setSegType(type);
    setSegValue(value ?? SEGMENT_DEFAULT_VALUE[type] ?? 7);
    setConfirming(false);
  };

  const applyTemplate = (tpl: { title: string; body: string }, seg?: BuiltinTemplate["segment"]) => {
    setTitle(tpl.title);
    setBody(tpl.body);
    if (seg && isSegmentAllowed(seg.type, advanced)) pickSegment(seg.type, seg.value);
    setConfirming(false);
  };

  const insertVariable = (v: string) => {
    const el = bodyRef.current;
    const tag = `{${v}}`;
    if (!el) return setBody((b) => b + tag);
    const start = el.selectionStart ?? body.length;
    const end = el.selectionEnd ?? body.length;
    setBody(body.slice(0, start) + tag + body.slice(end));
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + tag.length, start + tag.length);
    });
  };

  const send = () =>
    start(async () => {
      const r = await sendNotificationAction({
        title,
        body,
        segment: { type: segType, value: needsValue(segType) ? segValue : undefined },
      });
      if (r.ok) {
        toast({ tone: "success", text: t("sent") });
        setTitle("");
        setBody("");
        setConfirming(false);
        router.refresh();
      } else {
        setConfirming(false);
        toast({ tone: "danger", text: te((r.error === "form" ? "generic" : r.error) as never) });
      }
    });

  const saveTemplate = () =>
    start(async () => {
      const r = await saveTemplateAction({ name: templateName, title, body });
      if (r.ok) {
        toast({ tone: "success", text: t("templateSaved") });
        setTemplateName("");
        router.refresh();
      } else toast({ tone: "danger", text: te((r.fields?.name ?? r.error) as never) });
    });

  const sampleTitle = renderNotification(title || t("titlePlaceholder"), SAMPLE_VARS).slice(0, TITLE_MAX);
  const sampleBody = renderNotification(body || t("bodyPlaceholder"), SAMPLE_VARS).slice(0, BODY_MAX);
  const reach = preview ? preview.apple + preview.google + preview.push : 0;
  const ready = title.trim() && body.trim() && !exhausted && preview !== null && preview.total > 0;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
      <div className="flex flex-col gap-5">
        <Card className="flex flex-col gap-3">
          <h2 className="text-lg font-bold">{t("templatesTitle")}</h2>
          <div className="flex flex-wrap gap-2">
            {builtin.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => applyTemplate(b, b.segment)}
                className="ring-cream-200 hover:bg-cream-50 min-h-11 rounded-full px-4 text-sm font-semibold ring-1"
              >
                {t(`builtin.${b.id}` as never)}
              </button>
            ))}
            {custom.map((c) => (
              <span key={c.id} className="bg-primary-soft ring-primary/30 flex items-center rounded-full ring-1">
                <button
                  type="button"
                  onClick={() => applyTemplate(c)}
                  className="min-h-11 pr-2 pl-4 text-sm font-semibold"
                >
                  {c.name}
                </button>
                <button
                  type="button"
                  aria-label={t("deleteTemplate", { name: c.name })}
                  onClick={() =>
                    start(async () => {
                      await deleteTemplateAction(c.id);
                      router.refresh();
                    })
                  }
                  className="text-muted hover:text-danger min-h-11 min-w-9 pr-2 text-lg leading-none"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          {!canSaveTemplates && <p className="text-muted text-xs">{t("customTemplatesPlus")}</p>}
        </Card>

        <Card className="flex flex-col gap-4">
          <h2 className="text-lg font-bold">{t("messageTitle")}</h2>
          <Field id="n-title" label={t("titleLabel")} hint={`${title.length}/${TITLE_MAX}`}>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={TITLE_MAX}
              placeholder={t("titlePlaceholder")}
            />
          </Field>
          <Field id="n-body" label={t("bodyLabel")} hint={`${body.length}/${BODY_MAX}`}>
            <Textarea
              ref={bodyRef}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={BODY_MAX}
              placeholder={t("bodyPlaceholder")}
              className="min-h-24"
            />
          </Field>
          <div className="flex flex-wrap items-center gap-2" role="group" aria-label={t("variables")}>
            <span className="text-muted text-sm">{t("variables")}</span>
            {VARIABLES.map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => insertVariable(v)}
                className="bg-cream-100 hover:bg-cream-200 min-h-9 rounded-full px-3 font-mono text-xs"
              >
                {`{${v}}`}
              </button>
            ))}
          </div>
        </Card>

        <Card className="flex flex-col gap-4">
          <h2 className="text-lg font-bold">{t("audienceTitle")}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="n-seg" label={t("segmentLabel")}>
              <select
                value={segType}
                onChange={(e) => pickSegment(e.target.value as SegmentType)}
                className={selectClass}
              >
                {types.map((s) => (
                  <option key={s} value={s} disabled={!isSegmentAllowed(s, advanced)}>
                    {t(`segments.${s}` as never)}
                    {!isSegmentAllowed(s, advanced) ? ` · ${t("plusOnly")}` : ""}
                  </option>
                ))}
              </select>
            </Field>
            {needsValue(segType) && (
              <Field id="n-seg-value" label={t(`segmentValue.${segType}` as never)}>
                {segType === "level" ? (
                  <select
                    value={segValue}
                    onChange={(e) => setSegValue(Number(e.target.value))}
                    className={selectClass}
                  >
                    {levels.map((l, i) => (
                      <option key={l.name} value={i + 1}>
                        {l.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    max={3650}
                    value={segValue}
                    onChange={(e) => setSegValue(Math.max(1, Number(e.target.value) || 1))}
                  />
                )}
              </Field>
            )}
          </div>
          <div aria-live="polite" className="bg-cream-50 rounded-lg p-3 text-sm">
            {loadingPreview ? (
              <span className="text-muted">{t("calculating")}</span>
            ) : preview ? (
              <>
                <p className="font-semibold">{t("audienceCount", { count: preview.total })}</p>
                <p className="text-muted">
                  {t("reach", { reach })} ·{" "}
                  {t("reachDetail", { apple: preview.apple, google: preview.google, push: preview.push })}
                </p>
              </>
            ) : (
              <span className="text-muted">{t("audienceUnavailable")}</span>
            )}
          </div>
          <p className="text-muted text-xs">{t("audienceHint")}</p>
          <ul className="text-muted flex flex-wrap gap-2 text-xs">
            <li className="bg-cream-100 rounded-full px-2 py-1">{t("channelCard")}</li>
            {channels.apple && <li className="bg-cream-100 rounded-full px-2 py-1">Apple Wallet</li>}
            {channels.google && <li className="bg-cream-100 rounded-full px-2 py-1">Google Wallet</li>}
            {channels.push && <li className="bg-cream-100 rounded-full px-2 py-1">{t("channelPush")}</li>}
          </ul>
        </Card>

        {exhausted && <Alert tone="warning">{t("limitReached")}</Alert>}

        {confirming ? (
          <Alert tone="info" title={t("confirmTitle", { count: preview?.total ?? 0 })}>
            <div className="mt-2 flex flex-wrap gap-2">
              <Button loading={pending} onClick={send}>
                <Send aria-hidden />
                {t("confirmSend")}
              </Button>
              <Button variant="ghost" onClick={() => setConfirming(false)}>
                {t("cancel")}
              </Button>
            </div>
          </Alert>
        ) : (
          <div className="flex flex-wrap items-end gap-3">
            <Button size="lg" disabled={!ready} onClick={() => setConfirming(true)}>
              <Send aria-hidden />
              {t("send")}
            </Button>
            {canSaveTemplates && (
              <div className="flex flex-wrap items-end gap-2">
                <Field id="n-tpl" label={t("templateName")}>
                  <Input value={templateName} onChange={(e) => setTemplateName(e.target.value)} maxLength={40} />
                </Field>
                <Button
                  variant="secondary"
                  loading={pending}
                  disabled={!title.trim() || !body.trim() || templateName.trim().length < 2}
                  onClick={saveTemplate}
                >
                  <Save aria-hidden />
                  {t("saveTemplate")}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      <aside className="flex flex-col gap-3 lg:sticky lg:top-6 lg:self-start">
        <p className="text-muted text-sm font-semibold">{t("preview")}</p>
        <div className="bg-ink-950 rounded-3xl p-4">
          <div className="text-ink-950 flex items-start gap-3 rounded-2xl bg-white/95 p-3 shadow-lg">
            <span className="bg-brand text-on-brand flex size-10 shrink-0 items-center justify-center rounded-xl font-bold">
              {locationName.charAt(0)}
            </span>
            <span className="min-w-0 text-left text-sm leading-snug">
              <span className="flex items-center gap-1 text-xs text-stone-600">
                <Bell className="size-3" aria-hidden />
                {locationName} · {t("now")}
              </span>
              <strong className="block">{sampleTitle}</strong>
              <span className={cn("block break-words", !body && "text-stone-500")}>{sampleBody}</span>
            </span>
          </div>
        </div>
        <p className="text-muted text-xs">{t("previewHint")}</p>
        {remaining !== null && (
          <p className="text-sm font-semibold">{t("remaining", { count: Math.max(0, remaining) })}</p>
        )}
      </aside>
    </div>
  );
}
