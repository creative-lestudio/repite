import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Repite",
    short_name: "Repite",
    description: "Tu tarjeta de sellos, siempre a mano.",
    start_url: "/",
    display: "standalone",
    background_color: "#F4F8FF",
    theme_color: "#2255D6",
    lang: "es",
    icons: [
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
