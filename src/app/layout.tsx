import type { Metadata, Viewport } from "next";
import {
  DM_Serif_Display,
  Inter,
  Lora,
  Nunito,
  Plus_Jakarta_Sans,
  Playfair_Display,
  Poppins,
  Space_Grotesk,
} from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getTranslations } from "next-intl/server";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["600", "700", "800"],
  display: "swap",
});

// Tipografías opcionales de la marca de cada local: solo se descargan si una página las usa.
// next/font exige argumentos literales (sin spread).
const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-poppins",
  weight: ["400", "600", "700", "800"],
  display: "swap",
  preload: false,
});
const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  weight: ["400", "600", "700", "800"],
  display: "swap",
  preload: false,
});
const space = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space",
  weight: ["400", "600", "700"],
  display: "swap",
  preload: false,
});
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  weight: ["400", "600", "700", "800"],
  display: "swap",
  preload: false,
});
const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  weight: ["400", "600", "700"],
  display: "swap",
  preload: false,
});
const dmserif = DM_Serif_Display({
  subsets: ["latin"],
  variable: "--font-dmserif",
  weight: ["400"],
  display: "swap",
  preload: false,
});
const fontVars = [poppins, nunito, space, playfair, lora, dmserif].map((f) => f.variable).join(" ");

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("meta");
  return {
    title: { default: "Repite", template: "%s · Repite" },
    description: t("description"),
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
    manifest: "/manifest.webmanifest",
    appleWebApp: { capable: true, title: "Repite", statusBarStyle: "default" },
  };
}

export const viewport: Viewport = {
  themeColor: "#FF3B2E",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const locale = await getLocale();
  return (
    <html lang={locale} className={`${inter.variable} ${jakarta.variable} ${fontVars}`}>
      <body className="min-h-dvh">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
