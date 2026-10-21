import "server-only";
import QRCode from "qrcode";

/** QR en SVG con los colores de Repite (azul oscuro sobre blanco, contraste alto para escanear). */
export async function qrSvg(text: string, opts: { margin?: number } = {}) {
  return QRCode.toString(text, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: opts.margin ?? 1,
    color: { dark: "#0A1840", light: "#FFFFFF" },
  });
}
