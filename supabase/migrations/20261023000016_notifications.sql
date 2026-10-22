-- Notificaciones al móvil de los clientes: plantillas, envíos, entregas y avisos web (push).
-- Canales: aviso dentro de la tarjeta (siempre), Apple Wallet, Google Wallet y Web Push.

alter table public.wallet_registrations
  add column platform text not null default 'apple' check (platform in ('apple', 'google'));

create table public.notification_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  name text not null check (char_length(name) between 2 and 40),
  title text not null check (char_length(title) between 1 and 40),
  body text not null check (char_length(body) between 1 and 160),
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index on public.notification_templates (organization_id) where deleted_at is null;

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  location_id uuid not null references public.locations (id),
  title text not null check (char_length(title) between 1 and 40),
  body text not null check (char_length(body) between 1 and 160),
  segment jsonb not null,
  status text not null default 'sending' check (status in ('sending', 'sent', 'failed')),
  recipients int not null default 0,
  wallet_sent int not null default 0,
  push_sent int not null default 0,
  failed int not null default 0,
  created_by uuid references auth.users (id),
  created_at timestamptz not null default now(),
  sent_at timestamptz
);
create index on public.notifications (organization_id, created_at desc);

create table public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.notifications (id) on delete cascade,
  organization_id uuid not null references public.organizations (id),
  customer_id uuid not null references public.customers (id),
  channel text not null check (channel in ('in_app', 'apple_wallet', 'google_wallet', 'web_push')),
  -- texto ya personalizado para ese cliente
  title text not null,
  body text not null,
  status text not null default 'sent' check (status in ('sent', 'failed')),
  error text,
  created_at timestamptz not null default now(),
  unique (notification_id, customer_id, channel)
);
create index on public.notification_deliveries (customer_id, channel, created_at desc);
create index on public.notification_deliveries (organization_id, created_at desc);

create table public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  customer_id uuid not null references public.customers (id),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);
create index on public.push_subscriptions (customer_id);

do $$
declare t text;
begin
  foreach t in array array['notification_templates', 'notifications', 'notification_deliveries', 'push_subscriptions'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('alter table public.%I force row level security', t);
  end loop;
end $$;

create policy notification_templates_select on public.notification_templates for select to authenticated
  using (app.is_member(organization_id));
create policy notification_templates_insert on public.notification_templates for insert to authenticated
  with check (app.can_manage(organization_id));
create policy notification_templates_update on public.notification_templates for update to authenticated
  using (app.can_manage(organization_id)) with check (app.can_manage(organization_id));
create policy notifications_select on public.notifications for select to authenticated
  using (app.is_member(organization_id));
create policy notifications_insert on public.notifications for insert to authenticated
  with check (app.can_manage(organization_id));
create policy notification_deliveries_select on public.notification_deliveries for select to authenticated
  using (app.is_member(organization_id));
-- push_subscriptions: solo el servidor (service_role)

-- Clientes que cumplen un segmento. Solo con permiso de comunicaciones y sin aviso reciente.
-- Segmentos: all · new{value=días} · inactive{días} · birthday_month · near_reward{faltan} · reward_ready ·
--            frequent{visitas} · has_coupon
create or replace function public.notification_audience(p_org uuid, p_location uuid, p_segment jsonb, p_gap_days int)
returns table (
  customer_id uuid, name text, balance int, stamps_required int, reward_name text,
  has_apple boolean, has_google boolean, has_push boolean
)
language plpgsql stable security invoker set search_path = public, app as $$
declare
  prog public.loyalty_programs := app.active_program(p_location);
  seg text := p_segment->>'type';
  n int := coalesce(nullif(p_segment->>'value', '')::int, 0);
  tz text;
  today date;
begin
  select l.timezone into tz from public.locations l where l.id = p_location;
  today := (now() at time zone coalesce(tz, 'Europe/Madrid'))::date;
  return query
  with base as (
    select c.id, c.name, c.created_at, c.birthday, c.last_visit_at,
      (select count(*) from public.stamp_events e
        where e.customer_id = c.id and e.type = 'visit' and e.validation_status = 'approved'
          and not exists (select 1 from public.stamp_events r where r.reverses_event_id = e.id)) as visits,
      case when prog.id is null then 0 else app.card_balance(c.id, prog.id) end as bal
    from public.customers c
    where c.organization_id = p_org and c.deleted_at is null and c.marketing_consent
      and not exists (
        select 1 from public.notification_deliveries d
        where d.customer_id = c.id and d.channel = 'in_app'
          and d.created_at > now() - make_interval(days => greatest(p_gap_days, 0)))
  )
  select b.id, b.name, b.bal::int, prog.stamps_required, prog.reward_name,
    exists (select 1 from public.wallet_registrations w where w.customer_id = b.id and w.platform = 'apple'),
    exists (select 1 from public.wallet_registrations w where w.customer_id = b.id and w.platform = 'google'),
    exists (select 1 from public.push_subscriptions s where s.customer_id = b.id)
  from base b
  where case seg
    when 'all' then true
    when 'new' then b.created_at > now() - make_interval(days => greatest(n, 1))
    when 'inactive' then coalesce(b.last_visit_at, b.created_at) < now() - make_interval(days => greatest(n, 1))
    when 'birthday_month' then b.birthday is not null and extract(month from b.birthday) = extract(month from today)
    when 'near_reward' then prog.id is not null and b.bal < prog.stamps_required
                            and b.bal >= prog.stamps_required - greatest(n, 1)
    when 'reward_ready' then exists (
      select 1 from public.rewards r where r.customer_id = b.id and r.status = 'available'
        and (r.expires_at is null or r.expires_at > now()))
    when 'frequent' then b.visits >= greatest(n, 1)
    when 'has_coupon' then exists (
      select 1 from public.customer_coupons cc where cc.customer_id = b.id and cc.status = 'available'
        and (cc.expires_at is null or cc.expires_at > now()))
    else false end;
end $$;
revoke execute on function public.notification_audience from public, anon;
grant execute on function public.notification_audience to authenticated, service_role;
