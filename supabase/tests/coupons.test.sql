-- Cupones: emisión idempotente por audiencia, límites por plan, canje y aislamiento.
begin;
create extension if not exists pgtap with schema extensions;
select plan(15);

-- Aurora (growth): un cupón para todos, uno de bienvenida y uno de cumpleaños
insert into public.coupons (id, organization_id, title, audience) values
  ('c0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', '15 % en tu próxima compra', 'all'),
  ('c0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'Bienvenida', 'welcome'),
  ('c0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'Cumpleaños', 'birthday');

-- María cumple años este mes (seed): recibe «all» y «birthday», pero no «welcome» (ya era cliente)
select is(public.issue_coupons('a0000000-0000-4000-8000-0000000000e1'), 2, 'María recibe todos y cumpleaños');
select is(public.issue_coupons('a0000000-0000-4000-8000-0000000000e1'), 0, 'emitir otra vez no duplica');
-- Un cliente nuevo recibe el de bienvenida
insert into public.customers (id, organization_id, name, phone_e164)
  values ('d0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'Nueva Clienta', '+34677777777');
select is(public.issue_coupons('d0000000-0000-4000-8000-000000000001'), 2, 'cliente nuevo: todos y bienvenida');
select is(
  (public.customer_card('d0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-0000000000a1')->'coupons')::jsonb @> '[{"title":"Bienvenida"}]'::jsonb,
  true, 'la tarjeta lista el cupón');

-- Canje
select is(
  (public.redeem_coupon((select id from public.customer_coupons where customer_id = 'd0000000-0000-4000-8000-000000000001' and coupon_id = 'c0000000-0000-4000-8000-000000000002'),
    'a0000000-0000-4000-8000-0000000000a1', 'a0000000-0000-4000-8000-0000000000d1')->>'title'),
  'Bienvenida', 'se canjea');
select throws_ok(
  $$select public.redeem_coupon((select id from public.customer_coupons where customer_id = 'd0000000-0000-4000-8000-000000000001' and coupon_id = 'c0000000-0000-4000-8000-000000000002'),
    'a0000000-0000-4000-8000-0000000000a1', 'a0000000-0000-4000-8000-0000000000d1')$$,
  'P0001', 'coupon_already_redeemed', 'no se canjea dos veces');
select throws_ok(
  $$select public.redeem_coupon((select id from public.customer_coupons where customer_id = 'd0000000-0000-4000-8000-000000000001' and coupon_id = 'c0000000-0000-4000-8000-000000000001'),
    'b0000000-0000-4000-8000-0000000000b1', 'b0000000-0000-4000-8000-0000000000d1')$$,
  'P0001', 'coupon_not_found', 'otro local no puede canjearlo');

-- Caducado
update public.customer_coupons set expires_at = now() - interval '1 day'
  where customer_id = 'd0000000-0000-4000-8000-000000000001' and coupon_id = 'c0000000-0000-4000-8000-000000000001';
select throws_ok(
  $$select public.redeem_coupon((select id from public.customer_coupons where customer_id = 'd0000000-0000-4000-8000-000000000001' and coupon_id = 'c0000000-0000-4000-8000-000000000001'),
    'a0000000-0000-4000-8000-0000000000a1', 'a0000000-0000-4000-8000-0000000000d1')$$,
  'P0001', 'coupon_expired', 'un cupón caducado no se canjea');

-- Starter y Esencial no emiten cupones; Growth sí
insert into public.customers (id, organization_id, name, phone_e164)
  values ('d0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001', 'Cliente Sol 2', '+584141111111');
insert into public.coupons (organization_id, title, audience) values ('b0000000-0000-4000-8000-000000000001', 'Cupón Sol', 'all');
select is(public.issue_coupons('d0000000-0000-4000-8000-000000000002'), 0, 'Starter no emite cupones');
update public.organizations set plan = 'esencial' where id = 'b0000000-0000-4000-8000-000000000001';
select is(public.issue_coupons('d0000000-0000-4000-8000-000000000002'), 0, 'Esencial no emite cupones');
update public.organizations set plan = 'growth' where id = 'b0000000-0000-4000-8000-000000000001';
insert into public.coupons (organization_id, title, audience) values ('b0000000-0000-4000-8000-000000000001', 'Segundo cupón', 'all');
select is(public.issue_coupons('d0000000-0000-4000-8000-000000000002'), 2, 'Growth emite todos');

-- Aislamiento del dueño de Sol
create or replace function pg_temp.login(uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  set local role authenticated;
$$;
select pg_temp.login('22222222-2222-4222-8222-222222222222');
select is((select count(*)::int from public.coupons where organization_id = 'a0000000-0000-4000-8000-000000000001'), 0, 'no ve cupones ajenos');
select is((select count(*)::int from public.customer_coupons where organization_id = 'a0000000-0000-4000-8000-000000000001'), 0, 'no ve cupones emitidos ajenos');
select throws_ok(
  $$insert into public.coupons (organization_id, title) values ('a0000000-0000-4000-8000-000000000001', 'Intruso')$$,
  '42501', null, 'no puede crear cupones en otra cuenta');
select is((select count(*)::int from public.coupons), 2, 've sus dos cupones');

select * from finish();
rollback;
