-- Planes v2: starter (gratis, 50 clientes), esencial (25 €/mes), growth (49 €/mes). «Red» se contrata a medida.
-- basic → esencial y plus → growth. Los clientes existentes nunca se borran.
-- La prueba de 30 días (sin tarjeta) da todo lo de growth; al acabar, la cuenta vuelve a starter.

alter table public.organizations drop constraint organizations_plan_check;
update public.organizations set plan = 'esencial' where plan = 'basic';
update public.organizations set plan = 'growth' where plan = 'plus';
alter table public.organizations add constraint organizations_plan_check
  check (plan in ('starter', 'esencial', 'growth', 'trial', 'cancelled'));

create or replace function app.effective_plan(p_org uuid) returns text
language sql stable security definer set search_path = public as $$
  select case
    when o.plan in ('esencial', 'growth') then o.plan
    when o.plan = 'trial' and (o.trial_ends_at is null or o.trial_ends_at > now()) then 'trial'
    else 'starter'
  end
  from public.organizations o where o.id = p_org;
$$;

-- Límite de clientes del plan efectivo (null = sin límite). Solo starter tiene tope.
create or replace function app.customer_limit(p_org uuid) returns int
language sql stable security definer set search_path = public as $$
  select case app.effective_plan(p_org) when 'starter' then 50 else null end;
$$;

-- Cupones: solo growth (y la prueba). Starter y esencial no emiten.
do $$
declare def text;
begin
  def := pg_get_functiondef('public.issue_coupons(uuid)'::regprocedure);
  def := replace(def, E'when ''starter'' then 0 when ''basic'' then 1 else 100000 end',
                      E'when ''starter'' then 0 when ''esencial'' then 0 else 100000 end');
  if def not like '%''esencial'' then 0%' then raise exception 'issue_coupons no se pudo actualizar'; end if;
  execute def;
end $$;

-- Registro en el historial de migraciones
insert into supabase_migrations.schema_migrations(version, name, statements)
values ('20261023000017', 'plans_v2', array[]::text[]);
