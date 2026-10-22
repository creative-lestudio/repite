"use client";

import { Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type Platform = "ios" | "android" | "other";

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  // iPadOS se presenta como Mac con pantalla táctil
  if (/iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return "ios";
  if (/Android/.test(ua)) return "android";
  return "other";
}

const btn =
  "bg-ink-950 text-cream-50 hover:bg-ink-900 flex min-h-12 items-center justify-center gap-2 rounded-xl px-4 font-semibold";

/** Guardar la tarjeta en Apple Wallet (iPhone) o Google Wallet (Android). Solo aparece lo que el servidor tiene configurado. */
export function WalletButtons({ slug, apple, google }: { slug: string; apple: boolean; google: boolean }) {
  const t = useTranslations("customer.card");
  const [platform, setPlatform] = useState<Platform>("other");
  useEffect(() => setPlatform(detectPlatform()), []);

  const showApple = apple && platform !== "android";
  const showGoogle = google && platform !== "ios";
  if (!showApple && !showGoogle) return null;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-muted text-sm">{t("walletHint")}</p>
      <div className={cn("grid gap-2", showApple && showGoogle && "sm:grid-cols-2")}>
        {showApple && (
          <a href={`/c/${slug}/wallet/apple`} className={btn}>
            <Wallet className="size-5" aria-hidden />
            {t("addApple")}
          </a>
        )}
        {showGoogle && (
          <a href={`/c/${slug}/wallet/google`} className={btn}>
            <Wallet className="size-5" aria-hidden />
            {t("addGoogle")}
          </a>
        )}
      </div>
    </div>
  );
}
