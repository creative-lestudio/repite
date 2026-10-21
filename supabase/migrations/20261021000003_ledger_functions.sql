-- Repite · funciones transaccionales del libro de sellos
-- Las llama el servidor con service_role tras validar la sesión (equipo o cliente).
-- Todas son idempotentes por p_idempotency_key y serializan por cliente con advisory lock.

-- Los hashes nunca salen por la API con JWT de usuario
revoke select on public.staff_pins from authenticated;
grant select (id, organization_id, staff_member_id, location_id, failed_attempts, locked_until, active, created_at, updated_at)
  on public.staff_pins to authenticated;
revoke select on public.staff_devices from authenticated;
grant select (id, organization_id, location_id, name, last_seen_at, revoked_at, created_at, updated_at)
  on public.staff_devices to authenticated;
grant update (name, revoked_at) on public.staff_devices to authenticated;

-- Error de negocio con código estable que el servidor traduce a un mensaje amable
create or replace function app.fail(code text, detail jsonb default '{}'::jsonb) returns void
language plpgsql as $$
begin
  raise exception '%', code using errcode = 'P0001', detail = detail::text;
end $$;

create or replace function app.lock_customer(p_customer uuid) returns void
language sql as $$
  select pg_advisory_xact_lock(hashtextextended(p_customer::text, 0));
$$;

-- Programa activo: el del local si existe, si no el de la organización
create or replace function app.active_program(p_location uuid) returns public.loyalty_programs
language sql stable as $$
  select p.* from public.loyalty_programs p
  join public.locations l on l.id = p_location and l.organization_id = p.organization_id
  where p.active and p.deleted_at is null and (p.location_id = p_location or p.location_id is null)
  order by p.location_id nulls last, p.created_at desc
  limit 1;
$$;

create or replace function app.card_balance(p_customer uuid, p_program uuid) returns int
language sql stable as $$
  select coalesce(sum(quantity), 0)::int from public.stamp_events
  where customer_id = p_customer and program_id = p_program and validation_status = 'approved';
$$;

-- Si la tarjeta está llena, emite premios (uno por cada tarjeta completa) y la reinicia
create or replace function app.issue_rewards_if_full(p_customer uuid, p_program uuid, p_location uuid, p_source uuid)
returns int
language plpgsql as $$
declare
  prog public.loyalty_programs;
  bal int;
  issued int := 0;
  ev uuid;
  n int := 0;
begin
  select * into prog from public.loyalty_programs where id = p_program;
  bal := app.card_balance(p_customer, p_program);
  while bal >= prog.stamps_required loop
    n := n + 1;
    insert into public.stamp_events (organization_id, customer_id, location_id, program_id, type, quantity,
      source_event_id, idempotency_key)
    values (prog.organization_id, p_customer, p_location, p_program, 'reward_issued', -prog.stamps_required,
      p_source, 'reward:' || p_source || ':' || n)
    returning id into ev;
    insert into public.rewards (organization_id, customer_id, program_id, reward_name, earned_event_id, expires_at)
    values (prog.organization_id, p_customer, p_program, prog.reward_name, ev,
      case when prog.reward_expiry_days is not null then now() + make_interval(days => prog.reward_expiry_days) end);
    issued := issued + 1;
    bal := bal - prog.stamps_required;
  end loop;
  return issued;
end $$;

create or replace function app.card_state(p_customer uuid, p_program uuid) returns jsonb
language sql stable as $$
  select jsonb_build_object(
    'balance', app.card_balance(p_customer, p_program),
    'stamps_required', (select stamps_required from public.loyalty_programs where id = p_program),
    'rewards_available', (select count(*) from public.rewards
       where customer_id = p_customer and status = 'available' and (expires_at is null or expires_at > now()))
  );
$$;

-- Registrar visita: +1 sello con intervalo mínimo configurable por local (settings.stamp_cooldown_hours, por defecto 4)
create or replace function public.register_visit(
  p_location uuid, p_customer uuid, p_staff uuid, p_idempotency_key text
) returns jsonb
language plpgsql security definer set search_path = public, app, extensions as $$
declare
  loc public.locations;
  cust public.customers;
  prog public.loyalty_programs;
  existing public.stamp_events;
  cooldown_h numeric;
  last_visit timestamptz;
  ev_id uuid;
  issued int;
begin
  select * into existing from public.stamp_events where idempotency_key = p_idempotency_key;
  if found then
    return jsonb_build_object('event_id', existing.id, 'duplicate', true) || app.card_state(existing.customer_id, existing.program_id);
  end if;

  select * into loc from public.locations where id = p_location and deleted_at is null;
  if not found then perform app.fail('location_not_found'); end if;
  select * into cust from public.customers where id = p_customer and organization_id = loc.organization_id and deleted_at is null;
  if not found then perform app.fail('customer_not_found'); end if;
  prog := app.active_program(p_location);
  if prog.id is null then perform app.fail('no_active_program'); end if;

  perform app.lock_customer(p_customer);

  cooldown_h := coalesce((loc.settings ->> 'stamp_cooldown_hours')::numeric, 4);
  select max(e.created_at) into last_visit from public.stamp_events e
  where e.customer_id = p_customer and e.type = 'visit' and e.validation_status = 'approved'
    and not exists (select 1 from public.stamp_events r where r.reverses_event_id = e.id);
  if last_visit is not null and last_visit > now() - make_interval(secs => cooldown_h * 3600) then
    perform app.fail('cooldown', jsonb_build_object(
      'next_allowed_at', last_visit + make_interval(secs => cooldown_h * 3600), 'hours', cooldown_h));
  end if;

  insert into public.stamp_events (organization_id, customer_id, location_id, program_id, type, quantity,
    created_by_staff, idempotency_key)
  values (loc.organization_id, p_customer, p_location, prog.id, 'visit', 1, p_staff, p_idempotency_key)
  returning id into ev_id;

  update public.customers set last_visit_at = now() where id = p_customer;
  issued := app.issue_rewards_if_full(p_customer, prog.id, p_location, ev_id);

  insert into public.audit_log (organization_id, actor_type, actor_id, action, entity, entity_id, data)
  values (loc.organization_id, 'staff', p_staff, 'visit.register', 'stamp_event', ev_id, jsonb_build_object('customer_id', p_customer));

  return jsonb_build_object('event_id', ev_id, 'duplicate', false, 'rewards_issued', issued)
    || app.card_state(p_customer, prog.id);
end $$;

-- Deshacer una visita dentro de la ventana (por defecto 10 minutos). Si generó un premio sin canjear, lo anula.
create or replace function public.undo_visit(
  p_event uuid, p_staff uuid, p_window_minutes int default 10
) returns jsonb
language plpgsql security definer set search_path = public, app, extensions as $$
declare
  ev public.stamp_events;
  rw record;
begin
  select * into ev from public.stamp_events where id = p_event and type = 'visit';
  if not found then perform app.fail('event_not_found'); end if;
  perform app.lock_customer(ev.customer_id);
  if exists (select 1 from public.stamp_events where reverses_event_id = ev.id) then
    perform app.fail('already_undone');
  end if;
  if ev.created_at < now() - make_interval(mins => p_window_minutes) then
    perform app.fail('undo_window_passed', jsonb_build_object('minutes', p_window_minutes));
  end if;

  for rw in
    select r.id, r.status, e.id as issued_id, e.quantity
    from public.stamp_events e join public.rewards r on r.earned_event_id = e.id
    where e.source_event_id = ev.id and e.type = 'reward_issued'
  loop
    if rw.status = 'redeemed' then perform app.fail('reward_already_redeemed'); end if;
    update public.rewards set status = 'voided' where id = rw.id;
    insert into public.stamp_events (organization_id, customer_id, location_id, program_id, type, quantity,
      created_by_staff, reverses_event_id, idempotency_key)
    values (ev.organization_id, ev.customer_id, ev.location_id, ev.program_id, 'adjust', -rw.quantity,
      p_staff, rw.issued_id, 'undo:' || rw.issued_id);
  end loop;

  insert into public.stamp_events (organization_id, customer_id, location_id, program_id, type, quantity,
    created_by_staff, reverses_event_id, idempotency_key)
  values (ev.organization_id, ev.customer_id, ev.location_id, ev.program_id, 'adjust', -ev.quantity,
    p_staff, ev.id, 'undo:' || ev.id);

  update public.customers c set last_visit_at = (
    select max(e.created_at) from public.stamp_events e
    where e.customer_id = c.id and e.type = 'visit'
      and not exists (select 1 from public.stamp_events r where r.reverses_event_id = e.id)
  ) where c.id = ev.customer_id;

  insert into public.audit_log (organization_id, actor_type, actor_id, action, entity, entity_id)
  values (ev.organization_id, 'staff', p_staff, 'visit.undo', 'stamp_event', ev.id);

  return app.card_state(ev.customer_id, ev.program_id);
end $$;

-- El cliente pide un sello extra (historia o reseña): queda pendiente de validación
create or replace function public.request_bonus(
  p_location uuid, p_customer uuid, p_type text, p_evidence jsonb, p_idempotency_key text
) returns jsonb
language plpgsql security definer set search_path = public, app, extensions as $$
declare
  loc public.locations;
  prog public.loyalty_programs;
  ev_id uuid;
begin
  if p_type not in ('bonus_story', 'bonus_review') then perform app.fail('invalid_bonus_type'); end if;
  select * into loc from public.locations where id = p_location and deleted_at is null;
  if not found then perform app.fail('location_not_found'); end if;
  if not exists (select 1 from public.customers where id = p_customer and organization_id = loc.organization_id) then
    perform app.fail('customer_not_found');
  end if;
  prog := app.active_program(p_location);
  if prog.id is null then perform app.fail('no_active_program'); end if;
  if (p_type = 'bonus_story' and not prog.bonus_story_enabled) or (p_type = 'bonus_review' and not prog.bonus_review_enabled) then
    perform app.fail('bonus_disabled');
  end if;

  perform app.lock_customer(p_customer);
  -- un pendiente por tipo a la vez; reseña aprobada solo una vez por programa
  if exists (select 1 from public.stamp_events where customer_id = p_customer and type = p_type and validation_status = 'pending') then
    perform app.fail('bonus_already_pending');
  end if;
  if p_type = 'bonus_review' and exists (select 1 from public.stamp_events
      where customer_id = p_customer and program_id = prog.id and type = 'bonus_review' and validation_status = 'approved') then
    perform app.fail('bonus_review_already_given');
  end if;

  insert into public.stamp_events (organization_id, customer_id, location_id, program_id, type, quantity,
    validation_status, created_by_customer, evidence, idempotency_key)
  values (loc.organization_id, p_customer, p_location, prog.id, p_type, 1, 'pending', true,
    coalesce(p_evidence, '{}'::jsonb), p_idempotency_key)
  on conflict (idempotency_key) do nothing
  returning id into ev_id;

  return jsonb_build_object('event_id', ev_id);
end $$;

create or replace function public.validate_bonus(
  p_event uuid, p_staff uuid, p_approve boolean
) returns jsonb
language plpgsql security definer set search_path = public, app, extensions as $$
declare
  ev public.stamp_events;
  issued int := 0;
begin
  select * into ev from public.stamp_events where id = p_event and type in ('bonus_story', 'bonus_review');
  if not found then perform app.fail('event_not_found'); end if;
  perform app.lock_customer(ev.customer_id);
  select * into ev from public.stamp_events where id = p_event;
  if ev.validation_status <> 'pending' then perform app.fail('already_validated'); end if;

  update public.stamp_events
  set validation_status = case when p_approve then 'approved' else 'rejected' end,
      validated_by_staff = p_staff, validated_at = now()
  where id = p_event;

  if p_approve then
    issued := app.issue_rewards_if_full(ev.customer_id, ev.program_id, ev.location_id, ev.id);
  end if;

  insert into public.audit_log (organization_id, actor_type, actor_id, action, entity, entity_id, data)
  values (ev.organization_id, 'staff', p_staff, case when p_approve then 'bonus.approve' else 'bonus.reject' end,
    'stamp_event', ev.id, jsonb_build_object('customer_id', ev.customer_id));

  return jsonb_build_object('rewards_issued', issued) || app.card_state(ev.customer_id, ev.program_id);
end $$;

create or replace function public.redeem_reward(
  p_reward uuid, p_location uuid, p_staff uuid, p_idempotency_key text
) returns jsonb
language plpgsql security definer set search_path = public, app, extensions as $$
declare
  rw public.rewards;
  loc public.locations;
  ev_id uuid;
begin
  select * into rw from public.rewards where id = p_reward;
  if not found then perform app.fail('reward_not_found'); end if;
  select * into loc from public.locations where id = p_location and organization_id = rw.organization_id;
  if not found then perform app.fail('location_not_found'); end if;
  perform app.lock_customer(rw.customer_id);
  select * into rw from public.rewards where id = p_reward;
  if rw.status = 'redeemed' then perform app.fail('reward_already_redeemed'); end if;
  if rw.status <> 'available' or (rw.expires_at is not null and rw.expires_at <= now()) then
    perform app.fail('reward_not_available');
  end if;

  insert into public.stamp_events (organization_id, customer_id, location_id, program_id, type, quantity,
    created_by_staff, source_event_id, idempotency_key)
  values (rw.organization_id, rw.customer_id, p_location, rw.program_id, 'redeem', 0, p_staff, rw.earned_event_id, p_idempotency_key)
  returning id into ev_id;

  update public.rewards set status = 'redeemed', redeemed_event_id = ev_id, redeemed_by_staff = p_staff, redeemed_at = now()
  where id = p_reward;

  insert into public.audit_log (organization_id, actor_type, actor_id, action, entity, entity_id)
  values (rw.organization_id, 'staff', p_staff, 'reward.redeem', 'reward', rw.id);

  return app.card_state(rw.customer_id, rw.program_id);
end $$;

-- Verificación de PIN con bloqueo tras 5 intentos fallidos (15 minutos)
create or replace function public.verify_staff_pin(p_location uuid, p_staff uuid, p_pin text) returns jsonb
language plpgsql security definer set search_path = public, app, extensions as $$
declare
  sp public.staff_pins;
begin
  select * into sp from public.staff_pins
  where location_id = p_location and staff_member_id = p_staff and active
  for update;
  if not found then return jsonb_build_object('ok', false, 'reason', 'not_found'); end if;
  if sp.locked_until is not null and sp.locked_until > now() then
    return jsonb_build_object('ok', false, 'reason', 'locked', 'locked_until', sp.locked_until);
  end if;
  if not exists (select 1 from public.staff_members m where m.id = p_staff and m.active and m.deleted_at is null) then
    return jsonb_build_object('ok', false, 'reason', 'inactive');
  end if;
  if extensions.crypt(p_pin, sp.pin_hash) = sp.pin_hash then
    update public.staff_pins set failed_attempts = 0, locked_until = null where id = sp.id;
    return jsonb_build_object('ok', true);
  end if;
  update public.staff_pins
  set failed_attempts = failed_attempts + 1,
      locked_until = case when failed_attempts + 1 >= 5 then now() + interval '15 minutes' end
  where id = sp.id;
  return jsonb_build_object('ok', false, 'reason', 'wrong_pin', 'attempts_left', greatest(0, 4 - sp.failed_attempts));
end $$;

create or replace function public.set_staff_pin(p_location uuid, p_staff uuid, p_pin text) returns void
language plpgsql security definer set search_path = public, app, extensions as $$
declare org uuid;
begin
  if p_pin !~ '^[0-9]{4,6}$' then perform app.fail('invalid_pin'); end if;
  select organization_id into org from public.staff_members where id = p_staff;
  insert into public.staff_pins (organization_id, staff_member_id, location_id, pin_hash)
  values (org, p_staff, p_location, extensions.crypt(p_pin, extensions.gen_salt('bf', 10)))
  on conflict (staff_member_id, location_id)
  do update set pin_hash = excluded.pin_hash, failed_attempts = 0, locked_until = null, active = true;
end $$;

-- Ventana fija de rate limiting. Devuelve true si la petición está permitida.
create or replace function public.rate_limit_hit(p_key text, p_window_seconds int, p_max int) returns boolean
language plpgsql security definer set search_path = public as $$
declare
  ws timestamptz := to_timestamp(floor(extract(epoch from now()) / p_window_seconds) * p_window_seconds);
  c int;
begin
  insert into public.rate_limits (key, window_start, count) values (p_key, ws, 1)
  on conflict (key, window_start) do update set count = public.rate_limits.count + 1
  returning count into c;
  return c <= p_max;
end $$;

-- Crear organización con su primer local y su owner (onboarding)
create or replace function public.create_organization_with_owner(
  p_name text, p_country text, p_currency text, p_location_name text, p_slug text,
  p_timezone text, p_locale text
) returns jsonb
language plpgsql security definer set search_path = public, app, extensions as $$
declare
  uid uuid := auth.uid();
  org_id uuid;
  loc_id uuid;
begin
  if uid is null then perform app.fail('not_authenticated'); end if;
  insert into public.organizations (name, country, currency) values (p_name, p_country, p_currency) returning id into org_id;
  insert into public.locations (organization_id, name, slug, timezone, locale)
  values (org_id, p_location_name, p_slug, p_timezone, p_locale) returning id into loc_id;
  insert into public.memberships (user_id, organization_id, role) values (uid, org_id, 'owner');
  insert into public.opportunity_rules (organization_id, type, params) values
    (org_id, 'birthday', '{}'), (org_id, 'inactive', '{"days": 14}'),
    (org_id, 'near_reward', '{"missing": 1}'), (org_id, 'reward_ready', '{"remind_after_days": 3}');
  insert into public.audit_log (organization_id, actor_type, actor_id, action, entity, entity_id)
  values (org_id, 'user', uid, 'organization.create', 'organization', org_id);
  return jsonb_build_object('organization_id', org_id, 'location_id', loc_id);
end $$;

-- Permisos: las funciones de libro solo las ejecuta el servidor
revoke execute on function public.register_visit, public.undo_visit, public.request_bonus, public.validate_bonus,
  public.redeem_reward, public.verify_staff_pin, public.set_staff_pin, public.rate_limit_hit from public, anon, authenticated;
grant execute on function public.register_visit, public.undo_visit, public.request_bonus, public.validate_bonus,
  public.redeem_reward, public.verify_staff_pin, public.set_staff_pin, public.rate_limit_hit to service_role;
revoke execute on function public.create_organization_with_owner from public, anon;
grant execute on function public.create_organization_with_owner to authenticated;
