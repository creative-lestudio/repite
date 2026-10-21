import "server-only";
import { notFound, redirect } from "next/navigation";
import { getLocationBySlug } from "../repositories/locations";
import { getCustomerFromSession } from "./customer-session";

/** Para las subpáginas de /c/[slug]: sin tarjeta en este móvil, vuelve al registro. */
export async function requireCustomer(slug: string) {
  const location = await getLocationBySlug(slug);
  if (!location) notFound();
  const customer = await getCustomerFromSession(location.organizationId);
  if (!customer) redirect(`/c/${slug}`);
  return { location, customer };
}
