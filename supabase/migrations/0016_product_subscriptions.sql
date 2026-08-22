-- Compass como producto SaaS — suscripción de la agencia al producto.
--
-- Esto es independiente de `invoices`/`transactions` (que son la agencia
-- cobrándole a SUS clientes). Acá se modela la agencia pagándole a Compass.
--
-- Ninguna de las tres tablas tiene policies para `anon`/`authenticated`: se
-- tocan exclusivamente desde Edge Functions con la service role key, igual
-- que ya hacen `create-team-member`/`delete-team-member` para no confiar en
-- nada que venga del cliente. `product_plans` es la única excepción parcial:
-- expone lectura pública de los planes activos porque la página de precios
-- es pública.

-- ============================================================
-- SUPERADMIN: tabla separada, nunca org_id NULL
-- ============================================================
-- A propósito NO se modela el superadmin permitiendo org_id NULL en `users`
-- (ese fue el error real en Crew: NULL usado como "compartido/cualquier
-- org" terminó filtrando datos entre tenants). `users.org_id` sigue siendo
-- NOT NULL sin excepciones; el acceso cross-org del superadmin se resuelve
-- aparte, siempre vía Edge Function con service role.

create table product_admins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table product_admins enable row level security;
-- Sin policies: ni anon ni authenticated pueden tocar esta tabla desde el
-- cliente bajo ninguna circunstancia. Solo la service role (Edge Functions).

create or replace function is_product_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.product_admins where user_id = auth.uid())
$$;

-- ============================================================
-- PLANES (pricing de Compass, autoritativo del lado del servidor)
-- ============================================================

create table product_plans (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  description text,
  max_team_members integer,
  price_usd_monthly numeric not null,
  price_usd_yearly numeric not null,
  currency text not null default 'USD',
  is_highlighted boolean not null default false,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table product_plans enable row level security;

create policy "anyone can view active plans" on product_plans
  for select using (is_active = true);
-- Sin policies de insert/update/delete: solo la service role los edita.

-- Mismos planes y precios que ya estaban en la landing (src/pages/Landing),
-- ahora como fuente de verdad real para el checkout. Anual = mensual * 10
-- (2 meses gratis).
insert into product_plans (code, name, description, max_team_members, price_usd_monthly, price_usd_yearly, is_highlighted, sort_order)
values
  ('starter', 'Starter', 'Para agencias que recién arrancan a ordenar el laburo.', 3, 19, 190, false, 1),
  ('growth', 'Growth', 'Para agencias que ya facturan y necesitan control financiero.', 8, 39, 390, true, 2);

-- ============================================================
-- SUSCRIPCIONES (leads + intentos de pago + suscripciones activas)
-- ============================================================

create table product_subscriptions (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid references product_plans (id),
  contact_name text not null,
  contact_email text not null,
  org_name text not null,
  billing_cycle text not null check (billing_cycle in ('monthly', 'yearly')),
  status text not null default 'pending' check (status in ('pending', 'authorized', 'paused', 'cancelled')),
  amount_usd numeric,
  amount_ars numeric,
  ars_rate numeric,
  mp_preapproval_id text,
  mp_init_point text,
  notes text,
  created_at timestamptz not null default now()
);

alter table product_subscriptions enable row level security;
-- Sin policies: solo Edge Functions con service role (checkout, webhook,
-- listado de superadmin).

create index idx_product_subscriptions_status on product_subscriptions (status);
create index idx_product_subscriptions_mp_preapproval on product_subscriptions (mp_preapproval_id);

-- Da de alta a Lautaro como superadmin si ya tiene cuenta creada en Compass.
-- Si todavía no la tiene, no inserta nada (sin error) — correr de nuevo
-- después de que exista, o insertar manualmente con su user_id.
insert into product_admins (user_id)
select u.id
from public.users u
join auth.users au on au.id = u.id
where au.email = 'lautarorodriguez887@gmail.com'
on conflict (user_id) do nothing;
