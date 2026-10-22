-- Tarjetas en Apple Wallet: dispositivos que han guardado una tarjeta (para avisarles cuando cambian los sellos).
-- Google Wallet no necesita tabla: el objeto se actualiza por API con el id del cliente.
create table public.wallet_registrations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  customer_id uuid not null references public.customers (id) on delete cascade,
  location_id uuid not null references public.locations (id) on delete cascade,
  device_library_id text not null check (char_length(device_library_id) between 1 and 200),
  push_token text not null check (char_length(push_token) between 1 and 500),
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (device_library_id, customer_id, location_id)
);

create index wallet_registrations_customer_idx on public.wallet_registrations (customer_id, location_id);

-- Solo el servidor (service_role) accede: sin políticas para usuarios.
alter table public.wallet_registrations enable row level security;
alter table public.wallet_registrations force row level security;
