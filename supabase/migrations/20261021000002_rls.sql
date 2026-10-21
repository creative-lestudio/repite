-- Repite · Row Level Security
-- Regla general: un usuario autenticado solo ve filas de organizaciones donde tiene membresía activa.
-- Escritura directa solo para owner/manager. Clientes finales y equipo (PIN) nunca usan el JWT:
-- pasan por Server Actions con service_role y repositorios acotados por organization_id.

create or replace function app.is_platform_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.platform_admins where user_id = auth.uid());
$$;

create or replace function app.org_role(org uuid) returns text
language sql stable security definer set search_path = '' as $$
  select m.role from public.memberships m
  where m.user_id = auth.uid() and m.organization_id = org and m.deleted_at is null
  limit 1;
$$;

create or replace function app.is_member(org uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select app.org_role(org) is not null;
$$;

create or replace function app.can_manage(org uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select app.org_role(org) in ('owner', 'manager');
$$;

create or replace function app.is_owner(org uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select app.org_role(org) = 'owner';
$$;

grant execute on all functions in schema app to authenticated, service_role;

-- Activar RLS en todas las tablas públicas
do $$
declare t text;
begin
  for t in select tablename from pg_tables where schemaname = 'public' loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
  end loop;
end $$;

-- organizations
create policy org_select on public.organizations for select to authenticated
  using (app.is_member(id) or app.is_platform_admin());
create policy org_update on public.organizations for update to authenticated
  using (app.is_owner(id)) with check (app.is_owner(id));

-- memberships: cada uno ve las de sus organizaciones; solo el owner gestiona
create policy memberships_select on public.memberships for select to authenticated
  using (user_id = auth.uid() or app.is_member(organization_id));
create policy memberships_write on public.memberships for all to authenticated
  using (app.is_owner(organization_id)) with check (app.is_owner(organization_id));

-- platform_admins: solo lectura propia
create policy platform_admins_select on public.platform_admins for select to authenticated
  using (user_id = auth.uid());

-- Tablas de tenant: lectura para miembros, escritura para owner/manager
do $$
declare t text;
begin
  foreach t in array array[
    'locations','staff_members','customers','customer_notes','loyalty_programs',
    'opportunity_rules','opportunities','message_templates','messages','feature_flags'
  ] loop
    execute format($f$create policy %1$s_select on public.%1$I for select to authenticated
      using (app.is_member(organization_id))$f$, t);
    execute format($f$create policy %1$s_insert on public.%1$I for insert to authenticated
      with check (app.can_manage(organization_id))$f$, t);
    execute format($f$create policy %1$s_update on public.%1$I for update to authenticated
      using (app.can_manage(organization_id)) with check (app.can_manage(organization_id))$f$, t);
  end loop;
end $$;

-- feature_flags: los activa Repite (service_role), el dueño solo los lee
drop policy feature_flags_insert on public.feature_flags;
drop policy feature_flags_update on public.feature_flags;

-- Plantillas globales (organization_id null) visibles para cualquier usuario autenticado
create policy message_templates_global_select on public.message_templates for select to authenticated
  using (organization_id is null);

-- Libro de sellos y premios: solo lectura para miembros; se escriben con funciones de servidor
create policy stamp_events_select on public.stamp_events for select to authenticated
  using (app.is_member(organization_id));
create policy rewards_select on public.rewards for select to authenticated
  using (app.is_member(organization_id));

-- staff_pins / staff_devices: el manager ve metadatos (nunca se expone el hash desde la app)
create policy staff_pins_select on public.staff_pins for select to authenticated
  using (app.can_manage(organization_id));
create policy staff_devices_select on public.staff_devices for select to authenticated
  using (app.can_manage(organization_id));
create policy staff_devices_update on public.staff_devices for update to authenticated
  using (app.can_manage(organization_id)) with check (app.can_manage(organization_id));

-- audit_log: solo el owner lee
create policy audit_log_select on public.audit_log for select to authenticated
  using (app.is_owner(organization_id));

-- customer_sessions, magic_links, job_runs, rate_limits: sin políticas → solo service_role
