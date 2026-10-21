"use client";

import { Download } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

/** «Añadir a la pantalla de inicio»: botón nativo en Android/Chrome, instrucciones en iPhone. */
export function InstallPrompt() {
  const t = useTranslations("customer.settings");
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    setInstalled(window.matchMedia("(display-mode: standalone)").matches);
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    const handler = (e: Event) => {
      e.preventDefault();
      setEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (installed || (!event && !ios)) return null;

  return (
    <section aria-labelledby="install" className="bg-primary-soft flex flex-col gap-2 rounded-xl p-4">
      <h2 id="install" className="font-bold">
        {t("install")}
      </h2>
      <p className="text-sm">{t("installHint")}</p>
      {event ? (
        <Button
          onClick={async () => {
            await event.prompt();
            setEvent(null);
          }}
        >
          <Download aria-hidden />
          {t("install")}
        </Button>
      ) : (
        <p className="text-muted text-sm">{t("installIos")}</p>
      )}
    </section>
  );
}
