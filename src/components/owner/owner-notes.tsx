"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button, Field, Textarea } from "@/components/ui";
import { useToast } from "@/components/staff/toaster";
import { addOwnerNoteAction } from "@/server/actions/owner";

export function OwnerNoteForm({ customerId }: { customerId: string }) {
  const t = useTranslations("owner.customers");
  const te = useTranslations("errors");
  const router = useRouter();
  const toast = useToast();
  const [text, setText] = useState("");
  const [pending, start] = useTransition();

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await addOwnerNoteAction(customerId, text);
          if (r.ok) {
            setText("");
            router.refresh();
          } else toast({ tone: "danger", text: te(r.error as never) });
        });
      }}
    >
      <Field id="owner-note" label={t("noteLabel")}>
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={t("notePlaceholder")}
          maxLength={1000}
          className="min-h-20"
        />
      </Field>
      <Button type="submit" loading={pending} disabled={!text.trim()} className="self-start">
        {t("addNote")}
      </Button>
    </form>
  );
}
