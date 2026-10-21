-- Repite · esquema base
-- Convenciones: uuid como clave, created_at/updated_at, borrado lógico con deleted_at,
-- organization_id en toda tabla de tenant. Enumeraciones como text + check para poder evolucionar.

create extension if not exists pgcrypto with schema extensions;
create extension if not exists citext with schema extensions;

create schema if not exists app;
grant usage on schema app to authenticated, service_role;

-- updated_at automático
create or replace function app.set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ───────────────────────── Cuentas y locales ─────────────────────────

create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(name) between 1 and 120),
  country text not null check (country in ('ES', 'VE')),
  currency text not null check (currency in ('EUR', 'USD')),
  plan text not null default 'trial' check (plan in ('trial', 'pro', 'cancelled')),
  status text not null default 'active' check (status in ('active', 'suspended', 'closed')),
  trial_ends_at timestamptz default (now() + interval '30 days'),
  onboarding jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create table public.locations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  name text not null check (length(name) between 1 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]([a-z0-9-]{1,48}[a-z0-9])$'),
  address text,
  timezone text not null default 'Europe/Madrid',
  locale text not null default 'es-ES' check (locale in ('es-ES', 'es-VE')),
  logo_path text,
  brand_color text check (brand_color ~ '^#[0-9A-Fa-f]{6}$'),
  -- stamp_cooldown_hours, message_min_days, opportunity_hour, tone, opening_hours, contact_*
  settings jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index on public.locations (organization_id);

create table public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  organization_id uuid not null references public.organizations (id),
  location_id uuid references public.locations (id),
  role text not null check (role in ('owner', 'manager', 'staff')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create unique index memberships_user_org_uq on public.memberships (user_id, organization_id)
  where deleted_at is null;
create index on public.memberships (organization_id);

create table public.platform_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

-- ───────────────────────── Equipo (acceso por PIN) ─────────────────────────

create table public.staff_members (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  display_name text not null check (length(display_name) between 1 and 60),
  role text not null default 'staff' check (role in ('manager', 'staff')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index on public.staff_members (organization_id);

create table public.staff_pins (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  staff_member_id uuid not null references public.staff_members (id),
  location_id uuid not null references public.locations (id),
  pin_hash text not null,
  failed_attempts int not null default 0,
  locked_until timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index staff_pins_member_location_uq on public.staff_pins (staff_member_id, location_id);

create table public.staff_devices (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  location_id uuid not null references public.locations (id),
  name text not null default 'Tablet',
  token_hash text not null unique,
  last_seen_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ───────────────────────── Clientes ─────────────────────────

create table public.customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  name text not null check (length(name) between 1 and 80),
  phone_e164 text not null check (phone_e164 ~ '^\+[1-9][0-9]{7,14}$'),
  birthday date,
  locale text not null default 'es-ES' check (locale in ('es-ES', 'es-VE')),
  marketing_consent boolean not null default false,
  consent_at timestamptz,
  consent_source text,
  usual_order text,
  notes_summary text,
  first_location_id uuid references public.locations (id),
  last_visit_at timestamptz,
  qr_token text not null unique default encode(extensions.gen_random_bytes(16), 'hex'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create unique index customers_org_phone_uq on public.customers (organization_id, phone_e164)
  where deleted_at is null;
create index on public.customers (organization_id, last_visit_at);
create index customers_org_name_idx on public.customers (organization_id, lower(name));
create index on public.customers (organization_id, (extract(month from birthday)), (extract(day from birthday)));

create table public.customer_sessions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  customer_id uuid not null references public.customers (id),
  token_hash text not null unique,
  user_agent text,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.customer_sessions (customer_id);

create table public.magic_links (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  customer_id uuid not null references public.customers (id),
  token_hash text not null unique,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.customer_notes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  customer_id uuid not null references public.customers (id),
  author_staff_id uuid references public.staff_members (id),
  author_user_id uuid references auth.users (id),
  text text not null check (length(text) between 1 and 1000),
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index on public.customer_notes (customer_id, created_at desc);

-- ───────────────────────── Fidelidad ─────────────────────────

create table public.loyalty_programs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  location_id uuid references public.locations (id), -- null = toda la organización
  stamps_required int not null check (stamps_required between 3 and 30),
  reward_name text not null check (length(reward_name) between 1 and 80),
  reward_description text,
  reward_expiry_days int check (reward_expiry_days is null or reward_expiry_days > 0),
  bonus_story_enabled boolean not null default true,
  bonus_review_enabled boolean not null default true,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index on public.loyalty_programs (organization_id, location_id) where active and deleted_at is null;

-- Libro de sellos (append-only). El saldo de la tarjeta = suma de quantity aprobada.
-- visit/bonus_*: +n · reward_issued: -stamps_required (la tarjeta se llena y se reinicia)
-- redeem: 0 (marca el canje) · adjust: ±n (correcciones y deshacer, con reverses_event_id)
create table public.stamp_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  customer_id uuid not null references public.customers (id),
  location_id uuid not null references public.locations (id),
  program_id uuid not null references public.loyalty_programs (id),
  type text not null check (type in ('visit', 'bonus_story', 'bonus_review', 'reward_issued', 'redeem', 'adjust')),
  quantity int not null,
  validation_status text not null default 'approved' check (validation_status in ('pending', 'approved', 'rejected')),
  validated_by_staff uuid references public.staff_members (id),
  validated_by_user uuid references auth.users (id),
  validated_at timestamptz,
  created_by_staff uuid references public.staff_members (id),
  created_by_user uuid references auth.users (id),
  created_by_customer boolean not null default false,
  reverses_event_id uuid references public.stamp_events (id),
  source_event_id uuid references public.stamp_events (id),
  evidence jsonb,
  idempotency_key text not null unique,
  created_at timestamptz not null default now()
);
create index on public.stamp_events (customer_id, program_id, created_at desc);
create index on public.stamp_events (location_id, created_at desc);
create index on public.stamp_events (organization_id, type, created_at desc);
create index stamp_events_pending_idx on public.stamp_events (location_id) where validation_status = 'pending';
create unique index stamp_events_reverses_uq on public.stamp_events (reverses_event_id) where reverses_event_id is not null;

-- Solo se permite cambiar el estado de validación de un evento pendiente; nunca borrar.
create or replace function app.stamp_events_guard() returns trigger
language plpgsql as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'stamp_events es append-only' using errcode = 'P0001';
  end if;
  if old.validation_status <> 'pending'
     or new.quantity <> old.quantity or new.type <> old.type
     or new.customer_id <> old.customer_id or new.idempotency_key <> old.idempotency_key then
    raise exception 'stamp_events es append-only' using errcode = 'P0001';
  end if;
  return new;
end $$;
create trigger stamp_events_guard before update or delete on public.stamp_events
  for each row execute function app.stamp_events_guard();

create table public.rewards (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  customer_id uuid not null references public.customers (id),
  program_id uuid not null references public.loyalty_programs (id),
  reward_name text not null,
  status text not null default 'available' check (status in ('available', 'redeemed', 'expired', 'voided')),
  earned_event_id uuid not null unique references public.stamp_events (id),
  redeemed_event_id uuid references public.stamp_events (id),
  redeemed_by_staff uuid references public.staff_members (id),
  redeemed_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.rewards (customer_id, status);
create index on public.rewards (organization_id, status);

-- ───────────────────────── Oportunidades y mensajes ─────────────────────────

create table public.opportunity_rules (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  location_id uuid references public.locations (id),
  type text not null check (type in ('birthday', 'inactive', 'near_reward', 'reward_ready')),
  params jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create index on public.opportunity_rules (organization_id) where active;

create table public.opportunities (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  location_id uuid not null references public.locations (id),
  customer_id uuid not null references public.customers (id),
  rule_id uuid not null references public.opportunity_rules (id),
  type text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'scheduled', 'sent', 'dismissed')),
  dedupe_key text not null,
  context jsonb not null default '{}'::jsonb,
  detected_for date not null,
  decided_by uuid references auth.users (id),
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index opportunities_dedupe_uq on public.opportunities (customer_id, dedupe_key);
create index on public.opportunities (organization_id, status, created_at desc);

create table public.message_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations (id), -- null = plantilla global de Repite
  type text not null check (type in ('birthday', 'inactive', 'near_reward', 'reward_ready', 'magic_link')),
  locale text not null check (locale in ('es-ES', 'es-VE')),
  body text not null check (length(body) between 1 and 1000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);
create unique index message_templates_uq on public.message_templates
  (coalesce(organization_id, '00000000-0000-0000-0000-000000000000'::uuid), type, locale)
  where deleted_at is null;

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  location_id uuid references public.locations (id),
  customer_id uuid not null references public.customers (id),
  opportunity_id uuid references public.opportunities (id),
  channel text not null default 'whatsapp' check (channel in ('whatsapp')),
  kind text not null default 'marketing' check (kind in ('marketing', 'transactional')),
  body text not null,
  ai_generated boolean not null default false,
  status text not null default 'queued' check (status in ('draft', 'queued', 'sent', 'delivered', 'read', 'failed')),
  provider text,
  provider_message_id text,
  scheduled_at timestamptz,
  sent_at timestamptz,
  approved_by uuid references auth.users (id),
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.messages (organization_id, created_at desc);
create index on public.messages (customer_id, sent_at desc);
create index messages_due_idx on public.messages (scheduled_at) where status = 'queued';

-- ───────────────────────── Plataforma ─────────────────────────

create table public.job_runs (
  id uuid primary key default gen_random_uuid(),
  job text not null,
  location_id uuid references public.locations (id),
  run_date date not null,
  status text not null default 'running' check (status in ('running', 'done', 'failed')),
  stats jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index job_runs_uq on public.job_runs (job, location_id, run_date);

create table public.audit_log (
  id bigint generated always as identity primary key,
  organization_id uuid references public.organizations (id),
  actor_type text not null check (actor_type in ('user', 'staff', 'customer', 'system')),
  actor_id uuid,
  action text not null,
  entity text not null,
  entity_id uuid,
  data jsonb,
  ip inet,
  created_at timestamptz not null default now()
);
create index on public.audit_log (organization_id, created_at desc);

create table public.feature_flags (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id),
  key text not null,
  enabled boolean not null default false,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index feature_flags_uq on public.feature_flags (organization_id, key);

create table public.rate_limits (
  key text not null,
  window_start timestamptz not null,
  count int not null default 0,
  primary key (key, window_start)
);

-- triggers updated_at
do $$
declare t text;
begin
  foreach t in array array[
    'organizations','locations','memberships','staff_members','staff_pins','staff_devices',
    'customers','customer_notes','loyalty_programs','rewards','opportunity_rules','opportunities',
    'message_templates','messages','job_runs','feature_flags'
  ] loop
    execute format('create trigger set_updated_at before update on public.%I for each row execute function app.set_updated_at()', t);
  end loop;
end $$;
