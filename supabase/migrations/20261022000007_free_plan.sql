-- Repite · plan Gratis: hasta 50 clientes por cuenta, para siempre.
-- Todas las cuentas empiezan con 30 días del plan completo (trial); al acabar pasan a Gratis salvo que contraten Repite (pro).

alter table public.organizations drop constraint organizations_plan_check;
alter table public.organizations add constraint organizations_plan_check
  check (plan in ('free', 'trial', 'pro', 'cancelled'));

-- Plan efectivo ahora mismo: una prueba caducada o una cuenta cancelada cuentan como Gratis
create or replace function app.effective_plan(p_org uuid) returns text
language sql stable security definer set search_path = public as $$
  select case
    when o.plan = 'pro' then 'pro'
    when o.plan = 'trial' and (o.trial_ends_at is null or o.trial_ends_at > now()) then 'trial'
    else 'free'
  end
  from public.organizations o where o.id = p_org;
$$;

-- Límite de clientes del plan efectivo (null = sin límite)
create or replace function app.customer_limit(p_org uuid) returns int
language sql stable security definer set search_path = public as $$
  select case app.effective_plan(p_org) when 'free' then 50 else null end;
$$;

-- No se pueden crear clientes nuevos por encima del límite. Los que ya existen nunca se tocan.
create or replace function app.enforce_customer_limit() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  lim int := app.customer_limit(new.organization_id);
  current_count int;
begin
  if lim is null then return new; end if;
  -- serializa altas simultáneas de la misma organización
  perform pg_advisory_xact_lock(hashtextextended('customer-limit:' || new.organization_id::text, 0));
  select count(*) into current_count from public.customers
    where organization_id = new.organization_id and deleted_at is null;
  if current_count >= lim then
    raise exception 'customer_limit_reached' using errcode = 'P0001', detail = jsonb_build_object('limit', lim)::text;
  end if;
  return new;
end $$;

create trigger customers_limit before insert on public.customers
  for each row execute function app.enforce_customer_limit();

-- Uso del plan para el panel del dueño
create or replace function public.plan_usage(p_org uuid) returns jsonb
language plpgsql stable security definer set search_path = public, app as $$
begin
  if not app.is_member(p_org) then perform app.fail('not_authenticated'); end if;
  return jsonb_build_object(
    'plan', app.effective_plan(p_org),
    'customer_limit', app.customer_limit(p_org),
    'customers', (select count(*) from public.customers where organization_id = p_org and deleted_at is null)
  );
end $$;
revoke execute on function public.plan_usage from public, anon;
grant execute on function public.plan_usage to authenticated;
