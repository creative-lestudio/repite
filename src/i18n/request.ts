import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { defaultLocale, isLocale, LOCALE_COOKIE, type Locale } from "./config";
import { loadMessages } from "./messages";

// Sin prefijo de idioma en la URL (los QR deben ser cortos y estables).
// Orden: cookie elegida por la persona → cabecera x-repite-locale (idioma del local) → Accept-Language → es-ES.
export default getRequestConfig(async () => {
  const cookieLocale = (await cookies()).get(LOCALE_COOKIE)?.value;
  const h = await headers();
  const hinted = h.get("x-repite-locale");
  const accept = h.get("accept-language") ?? "";

  let locale: Locale = defaultLocale;
  if (isLocale(cookieLocale)) locale = cookieLocale;
  else if (isLocale(hinted)) locale = hinted;
  else if (/es-VE/i.test(accept)) locale = "es-VE";

  return { locale, messages: await loadMessages(locale), timeZone: "Europe/Madrid" };
});
