-- Starter: 50 clientes · Basic: 100 · Plus y prueba: sin límite.
begin;
create extension if not exists pgtap with schema extensions;
select plan(13);

insert into public.organizations (id, name, country, currency, plan) values
  ('f0000000-0000-4000-8000-000000000001', 'Starter SL', 'ES', 'EUR', 'starter'),
  ('f0000000-0000-4000-8000-000000000002', 'Plus SL', 'ES', 'EUR', 'plus'),
  ('f0000000-0000-4000-8000-000000000005', 'Basic SL', 'ES', 'EUR', 'basic');
insert into public.organizations (id, name, country, currency, plan, trial_ends_at) values
  ('f0000000-0000-4000-8000-000000000003', 'Prueba viva', 'ES', 'EUR', 'trial', now() + interval '10 days'),
  ('f0000000-0000-4000-8000-000000000004', 'Prueba caducada', 'ES', 'EUR', 'trial', now() - interval '1 day');

select is(app.effective_plan('f0000000-0000-4000-8000-000000000001'), 'starter', 'plan starter');
select is(app.effective_plan('f0000000-0000-4000-8000-000000000003'), 'trial', 'prueba en curso');
select is(app.effective_plan('f0000000-0000-4000-8000-000000000004'), 'starter', 'prueba caducada = starter');
select is(app.customer_limit('f0000000-0000-4000-8000-000000000001'), 50, 'límite de 50 en starter');
select is(app.effective_plan('f0000000-0000-4000-8000-000000000005'), 'basic', 'plan basic');
select is(app.customer_limit('f0000000-0000-4000-8000-000000000005'), 100, 'límite de 100 en basic');
select is(app.customer_limit('f0000000-0000-4000-8000-000000000003'), null, 'la prueba no tiene límite');
select is(app.customer_limit('f0000000-0000-4000-8000-000000000002'), null, 'sin límite en plus');

-- 50 clientes caben, el 51 no
insert into public.customers (organization_id, name, phone_e164)
select 'f0000000-0000-4000-8000-000000000001', 'Cliente ' || g, '+3460000' || lpad(g::text, 4, '0') from generate_series(1, 50) g;
select is((select count(*)::int from public.customers where organization_id = 'f0000000-0000-4000-8000-000000000001'), 50, 'caben 50 clientes');
select throws_ok(
  $$insert into public.customers (organization_id, name, phone_e164) values ('f0000000-0000-4000-8000-000000000001', 'Cliente 51', '+346000009999')$$,
  'P0001', 'customer_limit_reached', 'el cliente 51 se rechaza');

-- Plus: sin límite
insert into public.customers (organization_id, name, phone_e164)
select 'f0000000-0000-4000-8000-000000000002', 'Cliente ' || g, '+3461000' || lpad(g::text, 4, '0') from generate_series(1, 60) g;
select is((select count(*)::int from public.customers where organization_id = 'f0000000-0000-4000-8000-000000000002'), 60, 'plus admite más de 50');

-- Basic: 100 caben, el 101 no
insert into public.customers (organization_id, name, phone_e164)
select 'f0000000-0000-4000-8000-000000000005', 'Cliente ' || g, '+3463000' || lpad(g::text, 4, '0') from generate_series(1, 100) g;
select throws_ok(
  $$insert into public.customers (organization_id, name, phone_e164) values ('f0000000-0000-4000-8000-000000000005', 'Cliente 101', '+346300009999')$$,
  'P0001', 'customer_limit_reached', 'basic: el cliente 101 se rechaza');

-- Una prueba caducada con más de 50 clientes conserva los existentes pero no admite nuevos
alter table public.customers disable trigger customers_limit;
insert into public.customers (organization_id, name, phone_e164)
select 'f0000000-0000-4000-8000-000000000004', 'Cliente ' || g, '+3462000' || lpad(g::text, 4, '0') from generate_series(1, 55) g;
alter table public.customers enable trigger customers_limit;
select throws_ok(
  $$insert into public.customers (organization_id, name, phone_e164) values ('f0000000-0000-4000-8000-000000000004', 'Nuevo', '+346200009999')$$,
  'P0001', 'customer_limit_reached', 'prueba caducada con 55 clientes: no admite nuevos');

select * from finish();
rollback;
