-- Planes de Repite: starter (gratis, 50 clientes), basic (100 clientes), plus (sin límite).
-- La prueba de 30 días da todo lo de plus; al acabar, la cuenta pasa a starter salvo que contrate.
-- Las cuentas «free» pasan a starter y las «pro» a plus.

alter table public.organizations drop constraint organizations_plan_check;
update public.organizations set plan = 'starter' where plan = 'free';
update public.organizations set plan = 'plus' where plan = 'pro';
alter table public.organizations add constraint organizations_plan_check
  check (plan in ('starter', 'basic', 'plus', 'trial', 'cancelled'));

create or replace function app.effective_plan(p_org uuid) returns text
language sql stable security definer set search_path = public as $$
  select case
    when o.plan in ('basic', 'plus') then o.plan
    when o.plan = 'trial' and (o.trial_ends_at is null or o.trial_ends_at > now()) then 'trial'
    else 'starter'
  end
  from public.organizations o where o.id = p_org;
$$;

-- Límite de clientes del plan efectivo (null = sin límite). La prueba equivale a plus.
create or replace function app.customer_limit(p_org uuid) returns int
language sql stable security definer set search_path = public as $$
  select case app.effective_plan(p_org) when 'starter' then 50 when 'basic' then 100 else null end;
$$;
