import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import { createUserClient } from "@/lib/supabase/server";
import { randomToken, sha256 } from "../auth/tokens";

// Gestión del equipo. Lectura con RLS (JWT del dueño); escrituras con service_role siempre acotadas por organization_id,
// porque los PIN y los tokens de tablet no se pueden escribir desde el navegador.

export async function listStaff(locationId: string) {
  const supabase = await createUserClient();
  const [{ data: members, error }, { data: pins }] = await Promise.all([
    supabase
      .from("staff_members")
      .select("id, display_name, role, active")
      .is("deleted_at", null)
      .order("display_name"),
    supabase.from("staff_pins").select("staff_member_id, active, locked_until").eq("location_id", locationId),
  ]);
  if (error) throw error;
  const pinBy = new Map((pins ?? []).map((p) => [p.staff_member_id, p]));
  return (members ?? []).map((m) => {
    const pin = pinBy.get(m.id);
    return {
      id: m.id,
      name: m.display_name,
      role: m.role as "manager" | "staff",
      active: m.active && (pin?.active ?? false),
      locked: !!pin?.locked_until && new Date(pin.locked_until) > new Date(),
    };
  });
}

export async function addStaff(
  organizationId: string,
  locationId: string,
  name: string,
  role: "manager" | "staff",
  pin: string,
) {
  const db = createServiceClient();
  const { data, error } = await db
    .from("staff_members")
    .insert({ organization_id: organizationId, display_name: name, role })
    .select("id")
    .single();
  if (error) throw error;
  const { error: pErr } = await db.rpc("set_staff_pin", { p_location: locationId, p_staff: data.id, p_pin: pin });
  if (pErr) {
    await db.from("staff_members").delete().eq("id", data.id);
    throw pErr;
  }
  return data.id;
}

async function assertStaffInOrg(organizationId: string, staffId: string) {
  const { data } = await createServiceClient()
    .from("staff_members")
    .select("id")
    .eq("id", staffId)
    .eq("organization_id", organizationId)
    .maybeSingle();
  return !!data;
}

export async function changeStaffPin(organizationId: string, locationId: string, staffId: string, pin: string) {
  if (!(await assertStaffInOrg(organizationId, staffId))) return false;
  const { error } = await createServiceClient().rpc("set_staff_pin", {
    p_location: locationId,
    p_staff: staffId,
    p_pin: pin,
  });
  if (error) throw error;
  return true;
}

export async function setStaffActive(organizationId: string, locationId: string, staffId: string, active: boolean) {
  if (!(await assertStaffInOrg(organizationId, staffId))) return false;
  const db = createServiceClient();
  const { error } = await db
    .from("staff_members")
    .update({ active })
    .eq("id", staffId)
    .eq("organization_id", organizationId);
  if (error) throw error;
  await db
    .from("staff_pins")
    .update({ active })
    .eq("staff_member_id", staffId)
    .eq("location_id", locationId)
    .eq("organization_id", organizationId);
  return true;
}

export async function listDevices() {
  const supabase = await createUserClient();
  const { data, error } = await supabase
    .from("staff_devices")
    .select("id, name, last_seen_at, revoked_at, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

/** Crea una tablet y devuelve su token en claro (solo se guarda el hash; no se puede recuperar después). */
export async function createDevice(organizationId: string, locationId: string, name: string) {
  const token = randomToken(24);
  const { error } = await createServiceClient()
    .from("staff_devices")
    .insert({ organization_id: organizationId, location_id: locationId, name, token_hash: sha256(token) });
  if (error) throw error;
  return token;
}
