-- Notificaciones: segmentos de audiencia, consentimiento, intervalo mínimo y aislamiento.
begin;
create extension if not exists pgtap with schema extensions;
select plan(11);

create or replace function pg_temp.login(uid uuid) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  set local role authenticated;
$$;

create or replace function pg_temp.aud(seg jsonb, gap int default 0) returns int language sql as $$
  select count(*)::int from public.notification_audience(
    'a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-0000000000a1', seg, gap);
$$;
grant execute on function pg_temp.aud to authenticated;

select pg_temp.login('11111111-1111-4111-8111-111111111111');
select is(pg_temp.aud('{"type":"all"}'), 5, 'todos con permiso (Daniel no lo dio)');
select is(pg_temp.aud('{"type":"inactive","value":14}'), 1, 'sin venir en 14 días: Lucía F.');
select is(pg_temp.aud('{"type":"birthday_month"}'), 1, 'cumpleaños este mes: María');
select is(pg_temp.aud('{"type":"near_reward","value":1}'), 1, 'a un sello del premio: Javier');
select is(pg_temp.aud('{"type":"reward_ready"}'), 0, 'premio listo con permiso: nadie (Daniel no tiene permiso)');
select is(pg_temp.aud('{"type":"frequent","value":10}'), 1, 'frecuentes (10 visitas): María');
select is(pg_temp.aud('{"type":"inventado"}'), 0, 'un segmento desconocido no devuelve a nadie');

-- Intervalo mínimo: tras avisar a Javier, ya no entra durante 7 días
reset role;
insert into public.notifications (id, organization_id, location_id, title, body, segment, status)
  values ('e0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001',
          'a0000000-0000-4000-8000-0000000000a1', 'Hola', 'Prueba', '{"type":"all"}', 'sent');
insert into public.notification_deliveries (notification_id, organization_id, customer_id, channel, title, body)
  values ('e0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001',
          'a0000000-0000-4000-8000-0000000000e2', 'in_app', 'Hola', 'Prueba');
select pg_temp.login('11111111-1111-4111-8111-111111111111');
select is(pg_temp.aud('{"type":"all"}', 7), 4, 'con intervalo de 7 días no se repite a Javier');
select is(pg_temp.aud('{"type":"all"}', 0), 5, 'sin intervalo vuelve a entrar');

-- Aislamiento
select pg_temp.login('22222222-2222-4222-8222-222222222222');
select is(pg_temp.aud('{"type":"all"}'), 0, 'otra cuenta no ve clientes ajenos');
select throws_ok(
  $$insert into public.notifications (organization_id, location_id, title, body, segment)
    values ('a0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-0000000000a1', 'x', 'y', '{"type":"all"}')$$,
  '42501', null, 'no puede crear notificaciones en otra cuenta');

select * from finish();
rollback;
