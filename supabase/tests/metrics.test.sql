-- Resultados del dueño: números correctos con los datos de demostración y aislamiento entre cuentas.
begin;
create extension if not exists pgtap with schema extensions;
select plan(8);

create or replace function pg_temp.login(uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  set local role authenticated;
$$;

select pg_temp.login('11111111-1111-4111-8111-111111111111');
create temp table m on commit drop as
  select public.owner_metrics('a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-0000000000a1', 365, 'Europe/Madrid') as j;
grant select on m to authenticated;

select is((select (j->>'visits')::int from m), 34, 'visitas del demo');
select is((select (j->>'active_customers')::int from m), 6, 'clientes con visita');
select is((select (j->>'returning_customers')::int from m), 5, 'clientes que han vuelto');
select is((select (j->>'repeat_visits')::int from m), 28, 'visitas de repetición');
select is((select (j->>'rewards_issued')::int from m), 2, 'premios emitidos');
select is((select (j->>'rewards_redeemed')::int from m), 1, 'premios canjeados');
select is((select jsonb_array_length(j->'daily') from m), 365, 'una fila por día');

-- Otra cuenta no ve nada de Café Aurora
select pg_temp.login('22222222-2222-4222-8222-222222222222');
select is(
  (select (public.owner_metrics('a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-0000000000a1', 365, 'Europe/Madrid')->>'visits')::int),
  0, 'la otra cuenta ve 0 visitas');

select * from finish();
rollback;
