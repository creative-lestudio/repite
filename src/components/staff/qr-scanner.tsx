"use client";

import { Camera } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Alert, Button } from "@/components/ui";
import { parseCustomerQr } from "@/domain/qr";

type Status = "idle" | "scanning" | "denied" | "unsupported" | "notRepite";

interface Detector {
  detect(source: CanvasImageSource): Promise<{ rawValue: string }[]>;
}

/** Lee el QR personal del cliente con la cámara trasera. BarcodeDetector nativo y, si no existe, jsQR. */
export function QrScanner({ initialError }: { initialError?: string }) {
  const t = useTranslations("staff.scan");
  const router = useRouter();
  const video = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const stream = useRef<MediaStream | null>(null);

  useEffect(() => () => stream.current?.getTracks().forEach((tr) => tr.stop()), []);

  async function start() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("unsupported");
      return;
    }
    try {
      stream.current = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
    } catch {
      setStatus("denied");
      return;
    }
    const v = video.current!;
    v.srcObject = stream.current;
    await v.play();
    setStatus("scanning");

    const Native = (window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => Detector })
      .BarcodeDetector;
    const native = Native ? new Native({ formats: ["qr_code"] }) : null;
    const jsQR = native ? null : (await import("jsqr")).default;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true })!;

    const tick = async () => {
      if (!stream.current?.active) return;
      let text: string | null = null;
      if (v.readyState >= 2) {
        if (native) {
          const codes = await native.detect(v).catch(() => []);
          text = codes[0]?.rawValue ?? null;
        } else if (jsQR) {
          canvas.width = v.videoWidth;
          canvas.height = v.videoHeight;
          ctx.drawImage(v, 0, 0);
          const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
          text = jsQR(img.data, img.width, img.height)?.data ?? null;
        }
      }
      if (text) {
        const token = parseCustomerQr(text);
        if (token) {
          stream.current?.getTracks().forEach((tr) => tr.stop());
          navigator.vibrate?.(60);
          router.push(`/equipo/q/${token}`);
          return;
        }
        setStatus("notRepite");
      }
      setTimeout(tick, 200);
    };
    tick();
  }

  return (
    <div className="flex flex-col gap-4">
      {initialError === "notFound" && <Alert tone="warning">{t("notFound")}</Alert>}
      {status === "denied" && <Alert tone="danger">{t("denied")}</Alert>}
      {status === "unsupported" && <Alert tone="warning">{t("unsupported")}</Alert>}
      {status === "notRepite" && <Alert tone="warning">{t("notRepite")}</Alert>}
      <div className="relative aspect-square w-full max-w-md self-center overflow-hidden rounded-xl bg-blue-950">
        <video ref={video} playsInline muted className="size-full object-cover" aria-hidden />
        {status === "scanning" || status === "notRepite" ? (
          <div aria-hidden className="pointer-events-none absolute inset-[18%] rounded-xl border-4 border-white/90" />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <Button size="lg" onClick={start}>
              <Camera aria-hidden />
              {t("start")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
