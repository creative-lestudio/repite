"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Badge, Button } from "@/components/ui";
import { undoVisitAction } from "@/server/actions/staff";
import type { DayVisit } from "@/server/repositories/staff";

const UNDO_MINUTES = 10;

export function DayVisits({ visits, timeZone, now }: { visits: DayVisit[]; timeZone: string; now: number }) {
  const t = useTranslations("staff.home");
  const te = useTranslations("errors");
  const [pending, start] = useTransition();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<{ tone: "ok" | "error"; text: string } | null>(null);
  const time = new Intl.DateTimeFormat("es-ES", { hour: "2-digit", minute: "2-digit", timeZone });

  return (
    <div className="flex flex-col gap-2">
      <p aria-live="polite" className={message?.tone === "error" ? "text-danger text-sm" : "text-success text-sm"}>
        {message?.text}
      </p>
      <ol className="bg-surface shadow-card divide-y divide-blue-100 rounded-xl ring-1 ring-blue-100">
        {visits.map((v) => {
          const canUndo = !v.undone && now - new Date(v.created_at).getTime() < UNDO_MINUTES * 60_000;
          return (
            <li key={v.event_id} className="flex min-h-14 items-center gap-3 px-4 py-2">
              <time className="text-muted w-12 shrink-0 text-sm tabular-nums" dateTime={v.created_at}>
                {time.format(new Date(v.created_at))}
              </time>
              <Link href={`/equipo/clientes/${v.customer_id}`} className="flex min-w-0 flex-1 flex-col hover:underline">
                <span className="truncate font-semibold">{v.customer_name}</span>
                {v.staff_name && <span className="text-muted text-xs">{t("by", { name: v.staff_name })}</span>}
              </Link>
              {v.undone ? (
                <Badge tone="neutral">{t("undone")}</Badge>
              ) : canUndo ? (
                <Button
                  variant="ghost"
                  size="sm"
                  loading={pending && busy === v.event_id}
                  onClick={() => {
                    setBusy(v.event_id);
                    start(async () => {
                      const r = await undoVisitAction(v.event_id);
                      setMessage(
                        r.ok
                          ? { tone: "ok", text: t("undoDone") }
                          : { tone: "error", text: te(r.error as never, r.values as never) },
                      );
                    });
                  }}
                >
                  {t("undo")}
                </Button>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
