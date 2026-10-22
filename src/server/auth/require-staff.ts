import "server-only";
import { redirect } from "next/navigation";
import { getStaffSession } from "./staff-session";

/** Las páginas de /equipo se renderizan dentro del layout que ya pide tablet y PIN; esto es una segunda barrera. */
export async function requireStaff() {
  const session = await getStaffSession();
  if (!session) redirect("/equipo");
  return session;
}
