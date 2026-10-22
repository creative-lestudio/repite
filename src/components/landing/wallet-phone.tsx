import { BatteryFull, QrCode, SignalHigh, Wifi } from "lucide-react";
import { AppleWalletIcon } from "./wallet-logos";

/**
 * Móvil Pro Max en burdeos, en tres cuartos, enseñando la tarjeta de Repite en Apple Wallet.
 * Es una ilustración en CSS 3D (sin imágenes): se puede sustituir por una foto de producto con la
 * pantalla en blanco colocando esta misma interfaz encima.
 */
export function WalletPhone({
  business,
  level,
  rewardLabel,
  reward,
  couponLabel,
  coupon,
  stampsLabel,
  updatedLabel,
  updated,
  nearbyLabel,
  nearby,
  noticeTitle,
  noticeBody,
}: {
  business: string;
  level: string;
  rewardLabel: string;
  reward: string;
  couponLabel: string;
  coupon: string;
  stampsLabel: string;
  updatedLabel: string;
  updated: string;
  nearbyLabel: string;
  nearby: string;
  noticeTitle: string;
  noticeBody: string;
}) {
  return (
    <div
      className="relative mx-auto w-[17rem] [perspective:1600px] sm:w-[18.5rem]"
      role="img"
      aria-label={`${business}: ${stampsLabel}`}
    >
      <div
        aria-hidden
        className="relative [transform:rotateY(-14deg)_rotateX(2deg)] [transform-style:preserve-3d]"
        style={{ filter: "drop-shadow(18px 28px 30px rgba(0,0,0,0.55))" }}
      >
        {/* canto derecho (el grosor del móvil) con sus botones */}
        <div
          className="absolute top-[2%] left-full h-[96%] w-[1.1rem] origin-left [transform:rotateY(90deg)]"
          style={{ background: "linear-gradient(90deg,#7a2a3c 0%,#4a1520 55%,#2e0b14 100%)" }}
        >
          <span className="absolute top-[26%] left-[30%] h-16 w-[40%] rounded-full bg-[#33101a] ring-1 ring-[#8f3a4d]/60" />
          <span className="absolute top-[46%] left-[30%] h-10 w-[40%] rounded-full bg-[#33101a] ring-1 ring-[#8f3a4d]/60" />
        </div>

        {/* marco burdeos */}
        <div
          className="rounded-[3.1rem] p-[6px] ring-1 ring-black/40"
          style={{ background: "linear-gradient(145deg,#a04558 0%,#6a1f31 36%,#3f0f1c 68%,#7c2d41 100%)" }}
        >
          <div className="rounded-[2.7rem] bg-black p-[5px]">
            <div className="relative aspect-[9/19.2] overflow-hidden rounded-[2.4rem] bg-gradient-to-b from-[#2a0a12] via-[#14090c] to-black text-white">
              {/* isla dinámica */}
              <span className="absolute top-2 left-1/2 z-10 h-[1.4rem] w-[5.2rem] -translate-x-1/2 rounded-full bg-black" />
              {/* barra de estado */}
              <div className="flex items-center justify-between px-6 pt-3 text-[0.7rem] font-semibold">
                <span>9:41</span>
                <span className="flex items-center gap-1">
                  <SignalHigh className="size-3.5" />
                  <Wifi className="size-3.5" />
                  <BatteryFull className="size-4" />
                </span>
              </div>
              {/* aviso en pantalla (cuando el cliente está cerca del local) */}
              <div className="text-ink-950 absolute inset-x-2 top-[2.7rem] z-20 flex items-start gap-2.5 rounded-2xl bg-white/95 p-2.5 shadow-xl">
                <AppleWalletIcon className="size-8 shrink-0" />
                <span className="text-left text-[0.68rem] leading-snug">
                  <strong className="block">{noticeTitle}</strong>
                  {noticeBody}
                </span>
              </div>
              {/* cabecera de Wallet */}
              <div className="mt-[4.6rem] flex items-center justify-between px-5">
                <span className="text-xs font-semibold text-sky-400">Hecho</span>
                <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-sm leading-none">···</span>
              </div>

              {/* tarjeta */}
              <div className="bg-brand mx-3 mt-4 rounded-2xl p-3.5 shadow-xl">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-white/90 text-sm font-extrabold text-black">
                      {business.charAt(0)}
                    </span>
                    <span className="font-display text-sm leading-tight font-extrabold">{business}</span>
                  </div>
                  <span className="text-right text-[0.6rem] leading-tight font-semibold uppercase opacity-90">
                    {level}
                  </span>
                </div>
                <p className="mt-4 text-[0.6rem] font-semibold uppercase opacity-80">{stampsLabel}</p>
                <p className="font-display text-[1.65rem] leading-none font-extrabold tracking-[0.2em]">
                  ●●●●●<span className="opacity-45">○○○</span>
                </p>
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-[0.55rem] font-semibold uppercase opacity-80">{rewardLabel}</p>
                    <p className="font-bold">{reward}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[0.55rem] font-semibold uppercase opacity-80">{couponLabel}</p>
                    <p className="font-bold">{coupon}</p>
                  </div>
                </div>
                <div className="mx-auto mt-4 flex size-28 items-center justify-center rounded-xl bg-white text-black">
                  <QrCode className="size-24" strokeWidth={1.5} />
                </div>
              </div>

              {/* tarjetas apiladas detrás */}
              <div className="mx-6 -mt-2 h-4 rounded-b-xl bg-[#1d6fe0]/80" />
              <div className="mx-9 -mt-2 h-4 rounded-b-xl bg-[#2e9d5b]/80" />
              {/* información de la tarjeta */}
              <div className="mx-3 mt-5 rounded-2xl bg-white/10 p-3 text-[0.7rem]">
                <div className="flex justify-between gap-2 border-b border-white/10 pb-2">
                  <span className="opacity-70">{updatedLabel}</span>
                  <span className="font-semibold">{updated}</span>
                </div>
                <div className="flex justify-between gap-2 pt-2">
                  <span className="opacity-70">{nearbyLabel}</span>
                  <span className="font-semibold text-emerald-400">{nearby}</span>
                </div>
              </div>
              {/* indicador de inicio */}
              <span className="absolute bottom-2 left-1/2 h-1 w-28 -translate-x-1/2 rounded-full bg-white/70" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
