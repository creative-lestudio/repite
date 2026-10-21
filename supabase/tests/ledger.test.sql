-- Reglas del libro de sellos: intervalo mínimo, idempotencia, premios, deshacer y append-only.
begin;
create extension if not exists pgtap with schema extensions;
select plan(12);

-- Pablo tiene 1 sello y su última visita fue hace 5 días
select is((public.register_visit('a0000000-0000-4000-8000-0000000000a1', 'a0000000-0000-4000-8000-0000000000e6',
  'a0000000-0000-4000-8000-0000000000d1', 't:1') ->> 'balance')::int, 2, 'registrar visita suma un sello');

select is((public.register_visit('a0000000-0000-4000-8000-0000000000a1', 'a0000000-0000-4000-8000-0000000000e6',
  'a0000000-0000-4000-8000-0000000000d1', 't:1') ->> 'duplicate')::boolean, true, 'misma clave de idempotencia no duplica');

select throws_ok($$select public.register_visit('a0000000-0000-4000-8000-0000000000a1', 'a0000000-0000-4000-8000-0000000000e6',
  'a0000000-0000-4000-8000-0000000000d1', 't:2')$$, 'P0001', 'cooldown', 'no permite otro sello dentro del intervalo');

select is(app.card_balance('a0000000-0000-4000-8000-0000000000e6', 'a0000000-0000-4000-8000-0000000000c1'), 2, 'saldo correcto');

-- Deshacer
select is((public.undo_visit((select id from public.stamp_events where idempotency_key = 't:1'),
  'a0000000-0000-4000-8000-0000000000d1') ->> 'balance')::int, 1, 'deshacer devuelve el saldo');
select throws_ok($$select public.undo_visit((select id from public.stamp_events where idempotency_key = 't:1'),
  'a0000000-0000-4000-8000-0000000000d1')$$, 'P0001', 'already_undone', 'no se puede deshacer dos veces');

-- Tras deshacer, el intervalo vuelve a contar desde la visita anterior
select is((public.register_visit('a0000000-0000-4000-8000-0000000000a1', 'a0000000-0000-4000-8000-0000000000e6',
  'a0000000-0000-4000-8000-0000000000d1', 't:3') ->> 'balance')::int, 2, 'tras deshacer se puede volver a sellar');

-- Javier tiene 7/8: un sello más emite premio y reinicia la tarjeta
select is((public.register_visit('a0000000-0000-4000-8000-0000000000a1', 'a0000000-0000-4000-8000-0000000000e2',
  'a0000000-0000-4000-8000-0000000000d1', 't:4') ->> 'rewards_issued')::int, 1, 'al completar la tarjeta se emite un premio');
select is(app.card_balance('a0000000-0000-4000-8000-0000000000e2', 'a0000000-0000-4000-8000-0000000000c1'), 0, 'la tarjeta se reinicia');

-- Canje
select lives_ok($$select public.redeem_reward((select id from public.rewards where customer_id = 'a0000000-0000-4000-8000-0000000000e2'),
  'a0000000-0000-4000-8000-0000000000a1', 'a0000000-0000-4000-8000-0000000000d1', 't:5')$$, 'canjear premio');
select throws_ok($$select public.redeem_reward((select id from public.rewards where customer_id = 'a0000000-0000-4000-8000-0000000000e2'),
  'a0000000-0000-4000-8000-0000000000a1', 'a0000000-0000-4000-8000-0000000000d1', 't:6')$$, 'P0001', 'reward_already_redeemed',
  'no se puede canjear dos veces');

-- Append-only
select throws_ok($$delete from public.stamp_events where idempotency_key = 't:3'$$, 'P0001', null, 'no se pueden borrar eventos');

select * from finish();
rollback;
