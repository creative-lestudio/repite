"use client";

import { Bell, BellOff } from "lucide-react";
import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Alert, Button } from "@/components/ui";
import { subscribePushAction, unsubscribePushAction } from "@/server/actions/customer";

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

/** Activar o desactivar los avisos del local en este móvil (Web Push). */
export function PushToggle({
  slug,
  publicKey,
  locationName,
}: {
  slug: string;
  publicKey: string;
  locationName: string;
}) {
  const t = useTranslations("customer.settings");
  const [supported, setSupported] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [ios, setIos] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const ok = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
    setSupported(ok);
    setIos(/iphone|ipad|ipod/i.test(navigator.userAgent));
    if (!ok) return;
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setEnabled(Boolean(sub)))
      .catch(() => {});
  }, []);

  const enable = () =>
    start(async () => {
      setError(null);
      try {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") return setError(t("pushDenied"));
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });
        const r = await subscribePushAction(slug, sub.toJSON());
        if (r.ok) setEnabled(true);
        else setError(t("pushError"));
      } catch {
        setError(t("pushError"));
      }
    });

  const disable = () =>
    start(async () => {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await unsubscribePushAction(slug, sub.endpoint);
        await sub.unsubscribe();
      }
      setEnabled(false);
    });

  return (
    <section
      aria-labelledby="push"
      className="bg-surface shadow-card ring-cream-100 flex flex-col gap-3 rounded-xl p-5 ring-1"
    >
      <h2 id="push" className="font-bold">
        {t("pushTitle")}
      </h2>
      <p className="text-muted text-sm">{t("pushBody", { location: locationName })}</p>
      {!supported ? (
        <Alert tone="info">{ios ? t("pushIos") : t("pushUnsupported")}</Alert>
      ) : enabled ? (
        <Button variant="secondary" loading={pending} onClick={disable}>
          <BellOff aria-hidden />
          {t("pushOff")}
        </Button>
      ) : (
        <Button loading={pending} onClick={enable}>
          <Bell aria-hidden />
          {t("pushOn")}
        </Button>
      )}
      {error && (
        <p role="alert" className="text-danger text-sm">
          {error}
        </p>
      )}
    </section>
  );
}
