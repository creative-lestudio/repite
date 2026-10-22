import { ImageResponse } from "next/og";
import paths from "@/components/brand/paths.json";

export const alt = "Repite · Buen servicio + sistema = más recurrencia";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Imagen que se ve al compartir el enlace: crema, logotipo en negro, lema y una tarjeta de sellos en rojo de marca
export default function OpengraphImage() {
  const [x, y, w, h] = paths.wordmark.box;
  const logoW = 470;
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: "#F6EDE6",
        padding: 72,
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 36, maxWidth: 640 }}>
        <svg width={logoW} height={(logoW * h) / w} viewBox={`${x} ${y} ${w} ${h}`}>
          <path d={paths.wordmark.d} fill="#111111" fillRule="evenodd" />
        </svg>
        <div style={{ fontSize: 58, fontWeight: 800, color: "#111111", lineHeight: 1.05 }}>
          Hacemos que tus clientes vuelvan.
        </div>
        <div style={{ fontSize: 28, color: "#6B655E" }}>
          Sistema de fidelización para tu negocio. Buen servicio + sistema = más recurrencia.
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          width: 330,
          gap: 18,
          background: "#FFFFFF",
          padding: 32,
          borderRadius: 36,
          border: "2px solid #E6D8CC",
        }}
      >
        {Array.from({ length: 8 }, (_, i) => (
          <div
            key={i}
            style={{
              width: 66,
              height: 66,
              borderRadius: 33,
              display: "flex",
              background: i < 5 ? "#FF3B2E" : "#FFFFFF",
              border: i < 5 ? "none" : "3px dashed #E6D8CC",
            }}
          />
        ))}
      </div>
    </div>,
    size,
  );
}
