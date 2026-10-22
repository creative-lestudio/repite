-- Coordenadas del local para el aviso por cercanía de Wallet (Plus).
alter table public.locations
  add column latitude numeric(9, 6) check (latitude between -90 and 90),
  add column longitude numeric(9, 6) check (longitude between -180 and 180),
  add constraint locations_coords_together check ((latitude is null) = (longitude is null));
