-- Aislamiento entre cuentas: un dueño nunca ve ni modifica datos de otra organización.
begin;
create extension if not exists pgtap with schema extensions;
select plan(18);

-- Helpers para impersonar
create or replace function pg_temp.login(uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  set local role authenticated;
$$;

-- ── Como dueño de Café Aurora ──
select pg_temp.login('11111111-1111-4111-8111-111111111111');

select is((select count(*)::int from public.organizations), 1, 've solo su organización');
select is((select count(*)::int from public.customers where organization_id = 'b0000000-0000-4000-8000-000000000001'), 0,
  'no ve clientes de otra cuenta');
select ok((select count(*) from public.customers) > 0, 've sus propios clientes');
select is((select count(*)::int from public.stamp_events where organization_id = 'b0000000-0000-4000-8000-000000000001'), 0,
  'no ve sellos de otra cuenta');
select is((select count(*)::int from public.locations where slug = 'panaderia-sol'), 0, 'no ve locales de otra cuenta');
select is((select count(*)::int from public.staff_members where organization_id = 'b0000000-0000-4000-8000-000000000001'), 0,
  'no ve equipo de otra cuenta');

select throws_ok(
  $$insert into public.customers (organization_id, name, phone_e164) values ('b0000000-0000-4000-8000-000000000001', 'Intruso', '+34699999999')$$,
  '42501', null, 'no puede crear clientes en otra cuenta');

update public.customers set name = 'Hackeado' where organization_id = 'b0000000-0000-4000-8000-000000000001';
reset role;
select is((select count(*)::int from public.customers where name = 'Hackeado'), 0, 'no puede editar clientes de otra cuenta');
select pg_temp.login('11111111-1111-4111-8111-111111111111');

select throws_ok(
  $$insert into public.stamp_events (organization_id, customer_id, location_id, program_id, type, quantity, idempotency_key)
    values ('a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-0000000000e1', 'a0000000-0000-4000-8000-0000000000a1',
            'a0000000-0000-4000-8000-0000000000c1', 'visit', 50, 'hack')$$,
  '42501', null, 'no puede escribir directamente en el libro de sellos');

select throws_ok(
  $$select public.register_visit('a0000000-0000-4000-8000-0000000000a1', 'a0000000-0000-4000-8000-0000000000e1', null, 'x')$$,
  '42501', null, 'no puede llamar a las funciones de libro con su JWT');

select throws_ok($$select pin_hash from public.staff_pins$$, '42501', null, 'no puede leer hashes de PIN');
select is((select count(*)::int from public.customer_sessions), 0, 'no ve sesiones de clientes');
select is((select count(*)::int from public.audit_log where organization_id = 'b0000000-0000-4000-8000-000000000001'), 0,
  'no ve auditoría de otra cuenta');

-- ── Como dueño de Panadería Sol ──
reset role;
select pg_temp.login('22222222-2222-4222-8222-222222222222');
select is((select count(*)::int from public.customers), 1, 'el otro dueño solo ve su cliente');
select is((select count(*)::int from public.customers where organization_id = 'a0000000-0000-4000-8000-000000000001'), 0,
  'el otro dueño no ve Café Aurora');
select is((select count(*)::int from public.rewards where organization_id = 'a0000000-0000-4000-8000-000000000001'), 0,
  'el otro dueño no ve premios de Café Aurora');

-- ── Anónimo ──
reset role;
set local role anon;
select is((select count(*)::int from public.customers), 0, 'anónimo no ve clientes');
select is((select count(*)::int from public.locations), 0, 'anónimo no ve locales');

reset role;
select * from finish();
rollback;
