import "server-only";
import { PDFDocument, rgb, StandardFonts, type PDFFont } from "pdf-lib";
import QRCode from "qrcode";

// Material imprimible con la marca del local: cartel A4 para el mostrador y tarjeta A6 para las mesas.

/** pdf-lib solo escribe WinAnsi con las fuentes estándar: quitamos emojis y símbolos fuera de ese rango. */
function clean(text: string) {
  return [...text]
    .filter((ch) => ch.charCodeAt(0) <= 255 || ch === "€")
    .join("")
    .replace("€", "EUR")
    .trim();
}

function wrap(text: string, font: PDFFont, size: number, maxWidth: number) {
  const lines: string[] = [];
  let line = "";
  for (const word of clean(text).split(/\s+/)) {
    const test = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

function hexToRgb(hex: string) {
  const n = Number.parseInt(hex.replace("#", ""), 16);
  return rgb(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}

export interface MaterialInput {
  url: string;
  locationName: string;
  rewardName: string | null;
  stamps: number | null;
  brandColor: string | null;
  format: "a4" | "a6";
}

export async function buildMaterialPdf(input: MaterialInput): Promise<Uint8Array> {
  const a4 = input.format === "a4";
  const [w, h] = a4 ? [595.28, 841.89] : [297.64, 419.53];
  const k = a4 ? 1 : 0.5; // escala de tipografías y márgenes
  const brand = hexToRgb(input.brandColor ?? "#FF3B2E");
  const ink = hexToRgb("#111111");
  const muted = hexToRgb("#6B655E");

  const doc = await PDFDocument.create();
  doc.setTitle(`QR ${clean(input.locationName)}`);
  doc.setCreator("Repite");
  const page = doc.addPage([w, h]);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const center = (text: string, y: number, size: number, font: PDFFont, color = ink) =>
    page.drawText(text, { x: (w - font.widthOfTextAtSize(text, size)) / 2, y, size, font, color });

  // Banda superior con el nombre del local
  const band = 170 * k;
  page.drawRectangle({ x: 0, y: h - band, width: w, height: band, color: brand });
  const nameSize = 40 * k;
  const nameLines = wrap(input.locationName, bold, nameSize, w - 80 * k).slice(0, 2);
  const nameBlock = nameLines.length * nameSize * 1.15;
  nameLines.forEach((line, i) =>
    center(
      line,
      h - band / 2 + nameBlock / 2 - nameSize * (i + 0.85) * 1.15 + nameSize * 0.2,
      nameSize,
      bold,
      rgb(1, 1, 1),
    ),
  );

  center("Escanea y suma sellos", h - band - 70 * k, 30 * k, bold);
  center("Sin descargar nada. Con tu móvil.", h - band - 100 * k, 15 * k, regular, muted);

  // QR
  const png = await QRCode.toBuffer(input.url, {
    type: "png",
    width: 900,
    margin: 1,
    errorCorrectionLevel: "M",
    color: { dark: "#111111", light: "#FFFFFF" },
  });
  const img = await doc.embedPng(png);
  const qrSize = 300 * k;
  const qrY = h - band - 130 * k - qrSize;
  page.drawRectangle({
    x: (w - qrSize) / 2 - 14 * k,
    y: qrY - 14 * k,
    width: qrSize + 28 * k,
    height: qrSize + 28 * k,
    borderColor: brand,
    borderWidth: 3 * k,
    color: rgb(1, 1, 1),
  });
  page.drawImage(img, { x: (w - qrSize) / 2, y: qrY, width: qrSize, height: qrSize });

  // Premio
  if (input.rewardName) {
    const text = input.stamps ? `Con ${input.stamps} sellos, ${input.rewardName.toLowerCase()}` : input.rewardName;
    const lines = wrap(text, bold, 22 * k, w - 100 * k).slice(0, 2);
    lines.forEach((l, i) => center(l, qrY - 50 * k - i * 28 * k, 22 * k, bold, brand));
  }

  center("Hecho con Repite", 28 * k, 11 * k, regular, muted);
  return doc.save();
}
