-- Cupones (15 % en tu próxima compra…) y niveles VIP por número de visitas.

alter table public.loyalty_programs
  add column levels jsonb not null default '[]'::jsonb
  check (jsonb_typeof(levels) = 'array' and jsonb_array_length(levels) <= 3);

create table public.coupons (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  title text not null check (char_length(title) between 2 and 80),
  description text check (char_length(description) <= 200),
  -- all: a todos los clientes · welcome: a los clientes que se apunten después · birthday: en el mes de su cumpleaños
  audience text not null default 'all' check (audience in ('all', 'welcome', 'birthday')),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index on public.coupons (organization_id, active) where deleted_at is null;

create table public.customer_coupons (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  coupon_id uuid not null references public.coupons (id),
  customer_id uuid not null references public.customers (id),
  -- «once» o el año (cupones de cumpleaños): evita emitir el mismo cupón dos veces
  period_key text not null,
  status text not null default 'available' check (status in ('available', 'redeemed', 'expired', 'voided')),
  issued_at timestamptz not null default now(),
  expires_at timestamptz,
  redeemed_at timestamptz,
  redeemed_by_staff uuid references public.staff_members (id),
  redeemed_location uuid references public.locations (id),
  unique (coupon_id, customer_id, period_key)
);
create index on public.customer_coupons (customer_id, status);
create index on public.customer_coupons (organization_id, coupon_id);

alter table public.coupons enable row level security;
alter table public.coupons force row level security;
alter table public.customer_coupons enable row level security;
alter table public.customer_coupons force row level security;

create policy coupons_select on public.coupons for select to authenticated using (app.is_member(organization_id));
create policy coupons_insert on public.coupons for insert to authenticated with check (app.can_manage(organization_id));
create policy coupons_update on public.coupons for update to authenticated
  using (app.can_manage(organization_id)) with check (app.can_manage(organization_id));
create policy customer_coupons_select on public.customer_coupons for select to authenticated
  using (app.is_member(organization_id));

-- Emite a un cliente los cupones que le tocan. Idempotente. Starter no tiene cupones y Basic solo uno activo.
create or replace function public.issue_coupons(p_customer uuid) returns int
language plpgsql security definer set search_path = public, app as $$
declare
  cust public.customers;
  tz text;
  today date;
  max_active int;
  n int := 0;
begin
  select * into cust from public.customers where id = p_customer and deleted_at is null;
  if not found then return 0; end if;

  max_active := case app.effective_plan(cust.organization_id) when 'starter' then 0 when 'basic' then 1 else 100000 end;
  if max_active = 0 then return 0; end if;

  select l.timezone into tz from public.locations l
    where l.organization_id = cust.organization_id and l.deleted_at is null order by l.created_at limit 1;
  tz := coalesce(tz, 'Europe/Madrid');
  today := (now() at time zone tz)::date;

  insert into public.customer_coupons (organization_id, coupon_id, customer_id, period_key, expires_at)
  select c.organization_id, c.id, cust.id,
         case c.audience when 'birthday' then extract(year from today)::int::text else 'once' end,
         case c.audience
           when 'birthday' then least(coalesce(c.ends_at, 'infinity'::timestamptz),
                                      ((date_trunc('month', today) + interval '1 month') at time zone tz))
           else c.ends_at end
  from (
    select c0.*, row_number() over (order by c0.created_at) as rn
    from public.coupons c0
    where c0.organization_id = cust.organization_id and c0.active and c0.deleted_at is null
      and c0.starts_at <= now() and (c0.ends_at is null or c0.ends_at > now())
  ) c
  where c.rn <= max_active
    and (c.audience = 'all'
      or (c.audience = 'welcome' and cust.created_at >= c.created_at)
      or (c.audience = 'birthday' and cust.birthday is not null
          and extract(month from cust.birthday) = extract(month from today)))
  on conflict (coupon_id, customer_id, period_key) do nothing;
  get diagnostics n = row_count;
  return n;
end $$;

-- Canje de un cupón por el equipo de un local
create or replace function public.redeem_coupon(p_customer_coupon uuid, p_location uuid, p_staff uuid) returns jsonb
language plpgsql security definer set search_path = public, app as $$
declare
  cc public.customer_coupons;
  c public.coupons;
begin
  select cc2.* into cc from public.customer_coupons cc2
    join public.locations l on l.id = p_location and l.organization_id = cc2.organization_id
    where cc2.id = p_customer_coupon for update of cc2;
  if not found then perform app.fail('coupon_not_found'); end if;
  if cc.status = 'redeemed' then perform app.fail('coupon_already_redeemed'); end if;
  select * into c from public.coupons where id = cc.coupon_id;
  if cc.status <> 'available' or (cc.expires_at is not null and cc.expires_at <= now())
     or c.deleted_at is not null or not c.active then
    perform app.fail('coupon_expired');
  end if;
  update public.customer_coupons
    set status = 'redeemed', redeemed_at = now(), redeemed_by_staff = p_staff, redeemed_location = p_location
    where id = cc.id;
  return jsonb_build_object('customer_id', cc.customer_id, 'title', c.title);
end $$;

revoke execute on function public.issue_coupons from public, anon, authenticated;
revoke execute on function public.redeem_coupon from public, anon, authenticated;
grant execute on function public.issue_coupons to service_role;
grant execute on function public.redeem_coupon to service_role;

-- Estado de la tarjeta: añade visitas totales, niveles y cupones disponibles
create or replace function public.customer_card(p_customer uuid, p_location uuid) returns jsonb
language plpgsql stable security definer set search_path = public, app, extensions as $$
declare
  prog public.loyalty_programs;
  cust public.customers;
begin
  select c.* into cust from public.customers c
  join public.locations l on l.id = p_location and l.organization_id = c.organization_id
  where c.id = p_customer and c.deleted_at is null;
  if not found then perform app.fail('customer_not_found'); end if;

  prog := app.active_program(p_location);
  if prog.id is null then
    return jsonb_build_object('program', null);
  end if;

  return jsonb_build_object(
    'program', jsonb_build_object(
      'id', prog.id, 'stamps_required', prog.stamps_required, 'reward_name', prog.reward_name,
      'reward_description', prog.reward_description, 'reward_expiry_days', prog.reward_expiry_days,
      'bonus_story_enabled', prog.bonus_story_enabled, 'bonus_review_enabled', prog.bonus_review_enabled,
      'levels', prog.levels),
    'balance', app.card_balance(p_customer, prog.id),
    'visits_total', (
      select count(*) from public.stamp_events e
      where e.customer_id = p_customer and e.type = 'visit' and e.validation_status = 'approved'
        and not exists (select 1 from public.stamp_events r where r.reverses_event_id = e.id)),
    'rewards', coalesce((
      select jsonb_agg(jsonb_build_object('id', r.id, 'reward_name', r.reward_name, 'expires_at', r.expires_at,
        'created_at', r.created_at) order by r.created_at)
      from public.rewards r
      where r.customer_id = p_customer and r.status = 'available' and (r.expires_at is null or r.expires_at > now())
    ), '[]'::jsonb),
    'coupons', coalesce((
      select jsonb_agg(jsonb_build_object('id', cc.id, 'title', c.title, 'description', c.description,
        'expires_at', cc.expires_at) order by cc.issued_at)
      from public.customer_coupons cc join public.coupons c on c.id = cc.coupon_id
      where cc.customer_id = p_customer and cc.status = 'available'
        and (cc.expires_at is null or cc.expires_at > now()) and c.active and c.deleted_at is null
    ), '[]'::jsonb),
    'pending_bonuses', coalesce((
      select jsonb_agg(jsonb_build_object('id', e.id, 'type', e.type, 'created_at', e.created_at))
      from public.stamp_events e
      where e.customer_id = p_customer and e.validation_status = 'pending'
    ), '[]'::jsonb),
    'review_bonus_given', exists (
      select 1 from public.stamp_events e where e.customer_id = p_customer and e.program_id = prog.id
        and e.type = 'bonus_review' and e.validation_status = 'approved'),
    'last_visit_at', cust.last_visit_at
  );
end $$;
revoke execute on function public.customer_card from public, anon, authenticated;
grant execute on function public.customer_card to service_role;
