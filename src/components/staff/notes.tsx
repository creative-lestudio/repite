"use client";

import { Pin } from "lucide-react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Badge, Button, Checkbox, Field, Textarea } from "@/components/ui";
import { addNoteAction } from "@/server/actions/staff";
import type { Note } from "@/server/repositories/staff";
import { useStaffAction } from "./use-staff-action";

export function Notes({ customerId, notes }: { customerId: string; notes: Note[] }) {
  const t = useTranslations("staff.customer");
  const tc = useTranslations("common");
  const { pending, run } = useStaffAction();
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [pinned, setPinned] = useState(false);

  return (
    <section aria-labelledby="notes" className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 id="notes" className="text-lg font-bold">
          {t("notesTitle")}
        </h2>
        {!open && (
          <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
            {t("addNote")}
          </Button>
        )}
      </div>
      {open && (
        <form
          className="bg-surface ring-cream-100 flex flex-col gap-3 rounded-xl p-4 ring-1"
          onSubmit={(e) => {
            e.preventDefault();
            run(
              () => addNoteAction({ customerId, text, pinned }),
              () => {
                setText("");
                setPinned(false);
                setOpen(false);
                return null;
              },
            );
          }}
        >
          <Field id="note-text" label={t("noteLabel")}>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={t("notePlaceholder")}
              maxLength={1000}
              required
            />
          </Field>
          <Checkbox id="note-pin" checked={pinned} onChange={(e) => setPinned(e.target.checked)} label={t("notePin")} />
          <div className="flex gap-2">
            <Button type="submit" loading={pending} disabled={!text.trim()}>
              {t("addNote")}
            </Button>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              {tc("cancel")}
            </Button>
          </div>
        </form>
      )}
      {notes.length === 0 ? (
        <p className="text-muted text-sm">{t("notesEmpty")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {notes.map((n) => (
            <li key={n.id} className="bg-surface ring-cream-100 rounded-lg p-3 ring-1">
              <p>{n.text}</p>
              <p className="text-muted mt-1 flex items-center gap-2 text-xs">
                {n.pinned && (
                  <Badge>
                    <Pin className="size-3" aria-hidden />
                    {t("pinned")}
                  </Badge>
                )}
                {n.author && <span>{n.author}</span>}
                <time dateTime={n.created_at}>{new Date(n.created_at).toLocaleDateString("es-ES")}</time>
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
