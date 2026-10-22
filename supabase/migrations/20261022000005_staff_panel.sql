-- Repite · panel del equipo: búsqueda rápida de clientes y lista del día

create extension if not exists pg_trgm with schema extensions;

-- Búsqueda por nombre (ilike '%texto%') y por teléfono (like '%dígitos%')
create index if not exists customers_name_trgm_idx on public.customers
  using gin (lower(name) extensions.gin_trgm_ops) where deleted_at is null;
create index if not exists customers_phone_trgm_idx on public.customers
  using gin (phone_e164 extensions.gin_trgm_ops) where deleted_at is null;

-- Visitas del día de un local, con quién la registró y si ya se deshizo
create or replace function public.staff_day_visits(p_location uuid, p_since timestamptz) returns table (
  event_id uuid, customer_id uuid, customer_name text, staff_name text, created_at timestamptz, undone boolean
)
language sql stable security definer set search_path = public as $$
  select e.id, c.id, c.name, s.display_name, e.created_at,
    exists (select 1 from public.stamp_events r where r.reverses_event_id = e.id)
  from public.stamp_events e
  join public.customers c on c.id = e.customer_id
  left join public.staff_members s on s.id = e.created_by_staff
  where e.location_id = p_location and e.type = 'visit' and e.created_at >= p_since
  order by e.created_at desc
  limit 200;
$$;

-- Sellos extra pendientes de validar en un local
create or replace function public.staff_pending_bonuses(p_location uuid) returns table (
  event_id uuid, customer_id uuid, customer_name text, type text, evidence jsonb, created_at timestamptz
)
language sql stable security definer set search_path = public as $$
  select e.id, c.id, c.name, e.type, e.evidence, e.created_at
  from public.stamp_events e
  join public.customers c on c.id = e.customer_id
  where e.location_id = p_location and e.validation_status = 'pending'
  order by e.created_at;
$$;

revoke execute on function public.staff_day_visits, public.staff_pending_bonuses from public, anon, authenticated;
grant execute on function public.staff_day_visits, public.staff_pending_bonuses to service_role;
