import { ImageResponse } from "next/og";

export const alt = "Repite · Que tus clientes vuelvan";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// Imagen que se ve al compartir el enlace: azul de Repite, titular y una tarjeta de sellos
export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: "#F4F8FF",
        padding: 72,
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: 28, maxWidth: 640 }}>
        <div style={{ fontSize: 44, fontWeight: 800, color: "#2255D6" }}>Repite</div>
        <div style={{ fontSize: 68, fontWeight: 800, color: "#0A1840", lineHeight: 1.05 }}>
          Que tus clientes vuelvan.
        </div>
        <div style={{ fontSize: 30, color: "#5B6B8C" }}>Tarjeta de sellos con QR para tu cafetería. Sin apps.</div>
      </div>
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          width: 330,
          gap: 18,
          background: "white",
          padding: 32,
          borderRadius: 36,
          border: "2px solid #C9D8FF",
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
              background: i < 5 ? "#2255D6" : "white",
              border: i < 5 ? "none" : "3px dashed #C9D8FF",
            }}
          />
        ))}
      </div>
    </div>,
    size,
  );
}
