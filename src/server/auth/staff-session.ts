import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";
import { createServiceClient } from "@/lib/supabase/server";
import { getLocationById, type PublicLocation } from "../repositories/locations";
import { seal, unseal } from "./signed";
import { sha256 } from "./tokens";

// Acceso del equipo en dos pasos:
// 1) la tablet se vincula al local con un token de dispositivo (cookie "rd", 400 días, hash en staff_devices);
// 2) cada empleado elige su nombre y teclea su PIN → cookie firmada "rs" con caducidad de 8 horas.

export const DEVICE_COOKIE = "rd";
export const STAFF_COOKIE = "rs";
const STAFF_SESSION_HOURS = 8;

const cookieBase = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};

export interface StaffDevice {
  id: string;
  organizationId: string;
  location: PublicLocation;
  name: string;
}

export interface StaffSession {
  device: StaffDevice;
  staffId: string;
  staffName: string;
  role: "manager" | "staff";
}

/** Busca el dispositivo por su token en claro. */
export async function findDeviceByToken(token: string) {
  const { data, error } = await createServiceClient()
    .from("staff_devices")
    .select("id, organization_id, location_id, name, revoked_at")
    .eq("token_hash", sha256(token))
    .maybeSingle();
  if (error) throw error;
  if (!data || data.revoked_at) return null;
  return data;
}

export async function pairDevice(token: string): Promise<boolean> {
  const device = await findDeviceByToken(token);
  if (!device) return false;
  (await cookies()).set(DEVICE_COOKIE, token, { ...cookieBase, maxAge: 60 * 60 * 24 * 400 });
  await createServiceClient()
    .from("staff_devices")
    .update({ last_seen_at: new Date().toISOString() })
    .eq("id", device.id);
  return true;
}

/** Dispositivo vinculado a esta tablet, o null. */
export const getDevice = cache(async (): Promise<StaffDevice | null> => {
  const token = (await cookies()).get(DEVICE_COOKIE)?.value;
  if (!token) return null;
  const device = await findDeviceByToken(token);
  if (!device) return null;
  const location = await getLocationById(device.location_id);
  if (!location || location.organizationId !== device.organization_id) return null;
  return { id: device.id, organizationId: device.organization_id, location, name: device.name };
});

interface SealedStaff {
  sid: string; // staff_member_id
  did: string; // staff_device_id
  exp: number;
}

/** Sesión del empleado en esta tablet, validada contra la BD (empleado activo y PIN activo en el local). */
export const getStaffSession = cache(async (): Promise<StaffSession | null> => {
  const device = await getDevice();
  if (!device) return null;
  const sealed = unseal<SealedStaff>((await cookies()).get(STAFF_COOKIE)?.value);
  if (!sealed || sealed.did !== device.id || sealed.exp < Date.now()) return null;
  const { data, error } = await createServiceClient()
    .from("staff_members")
    .select("id, display_name, role, active, deleted_at, staff_pins!inner(location_id, active)")
    .eq("id", sealed.sid)
    .eq("organization_id", device.organizationId)
    .eq("staff_pins.location_id", device.location.id)
    .maybeSingle();
  if (error) throw error;
  if (!data || !data.active || data.deleted_at || !data.staff_pins.some((p) => p.active)) return null;
  return { device, staffId: data.id, staffName: data.display_name, role: data.role as "manager" | "staff" };
});

export async function startStaffSession(deviceId: string, staffId: string) {
  const exp = Date.now() + STAFF_SESSION_HOURS * 3600_000;
  (await cookies()).set(STAFF_COOKIE, seal<SealedStaff>({ sid: staffId, did: deviceId, exp }), {
    ...cookieBase,
    expires: new Date(exp),
  });
}

export async function endStaffSession() {
  (await cookies()).delete(STAFF_COOKIE);
}

/** Empleados con PIN activo en el local de la tablet (para elegir nombre). */
export async function listStaffForDevice(device: StaffDevice) {
  const { data, error } = await createServiceClient()
    .from("staff_members")
    .select("id, display_name, staff_pins!inner(location_id, active)")
    .eq("organization_id", device.organizationId)
    .eq("active", true)
    .is("deleted_at", null)
    .eq("staff_pins.location_id", device.location.id)
    .eq("staff_pins.active", true)
    .order("display_name");
  if (error) throw error;
  return (data ?? []).map((s) => ({ id: s.id, name: s.display_name }));
}
