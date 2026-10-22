-- Marca del local: tipografía, forma de sello, estilo de tarjeta e imágenes propias.
-- El color principal sigue en locations.brand_color y el logotipo en locations.logo_path.
alter table public.locations
  add column brand jsonb not null default '{}'::jsonb
  check (jsonb_typeof(brand) = 'object' and pg_column_size(brand) < 4000);

-- Imágenes de marca (logotipo, sello propio, fondo de tarjeta): lectura pública, escritura solo desde el servidor.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('brand', 'brand', true, 4194304, array['image/png', 'image/jpeg', 'image/webp'])
on conflict (id) do nothing;
