import "server-only";
import QRCode from "qrcode";

/** QR en SVG con los colores de Repite (negro sobre blanco, contraste alto para escanear). */
export async function qrSvg(text: string, opts: { margin?: number } = {}) {
  return QRCode.toString(text, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: opts.margin ?? 1,
    color: { dark: "#111111", light: "#FFFFFF" },
  });
}
