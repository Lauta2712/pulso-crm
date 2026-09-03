-- Pulso CRM (Compass) — soporte real de multi-org.
--
-- Hasta ahora `users` era 1:1 con una org (`org_id not null`, `role`). Un
-- mismo login no podía pertenecer a más de una agencia. Esta migración
-- introduce `org_members` como fuente de verdad de membresía+rol por org, y
-- `users` pasa a ser un perfil global con una `active_org_id` ("en qué org
-- estoy parado ahora mismo").
--
-- Punto de diseño clave: `auth_org_id()` y `auth_role()` mantienen el mismo
-- nombre y contrato externo (devuelven un solo org_id/role). Por eso NINGUNA
-- policy de las tablas org-scoped existentes (clients, projects, tasks,
-- invoices, accounts, etc.) necesita tocarse — todas ya pasan por esas dos
-- funciones, nunca por users.org_id/users.role directamente. Se verificó
-- con grep sobre las 16 migraciones previas.

-- ============================================================
-- 1. org_members
-- ============================================================

create table org_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  role member_role not null default 'developer',
  created_at timestamptz not null default now(),
  unique (org_id, user_id)
);

create index idx_org_members_user on org_members (user_id);
create index idx_org_members_org on org_members (org_id);

alter table org_members enable row level security;

-- ============================================================
-- 2. Backfill: una fila de org_members por cada users.org_id/role actual
-- ============================================================

insert into org_members (org_id, user_id, role, created_at)
select org_id, id, role, created_at from users;

-- ============================================================
-- 3. users.active_org_id — reemplaza a users.org_id como "org activa"
-- ============================================================
-- Sin on delete cascade/set null a propósito: hoy no existe una feature de
-- "borrar org", así que un delete accidental de una org con miembros debe
-- fallar (FK), no dejar usuarios con active_org_id huérfano en silencio.

alter table users add column active_org_id uuid references orgs (id);
update users set active_org_id = org_id;
alter table users alter column active_org_id set not null;

-- ============================================================
-- 4. Fuera los dos triggers viejos de cambio de rol sobre `users`
-- ============================================================
-- Estaban duplicados (0002_multi_tenant.sql y 0005/0006) y ambos referencian
-- old.role/new.role, que están por dejar de existir en `users`.

drop trigger if exists trg_enforce_role_change on users;
drop function if exists public.enforce_role_change();
drop trigger if exists trg_prevent_role_change_by_non_owner on users;
drop function if exists public.prevent_role_change_by_non_owner();

-- ============================================================
-- 5. Trigger nuevo de cambio de rol, sobre org_members
-- ============================================================
-- Preserva el bypass `auth.uid() is null` de 0006: create-team-member /
-- delete-team-member corren con la service role key (sin auth.uid()) y no
-- deben quedar bloqueados por este check.

create or replace function public.enforce_org_member_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    if auth.uid() is not null and not exists (
      select 1 from public.org_members
      where user_id = auth.uid() and org_id = old.org_id and role = 'owner'
    ) then
      raise exception 'Solo el owner puede cambiar roles';
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_enforce_org_member_role_change
  before update on public.org_members
  for each row execute procedure public.enforce_org_member_role_change();

-- ============================================================
-- 6. Fuera las policies viejas de `users` (referencian org_id)
-- ============================================================

drop policy if exists "org members can view users" on users;
drop policy if exists "org members can update users" on users;

-- ============================================================
-- 7-8. auth_org_id() / auth_role() — mismo contrato, nueva fuente
-- ============================================================

create or replace function auth_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select active_org_id from public.users where id = auth.uid()
$$;

create or replace function auth_role()
returns member_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.org_members where user_id = auth.uid() and org_id = auth_org_id()
$$;

-- ============================================================
-- 9. Policies nuevas de `users` + bloqueo de auto-escalación
-- ============================================================
-- IMPORTANTE: con solo `using (id = auth.uid())` en el update, cualquier
-- usuario podría hacer `update users set active_org_id = '<org ajena>'`
-- desde la consola del browser y auto-asignarse a otro tenant — todas las
-- policies del resto del sistema confían en auth_org_id(), que ahora lee
-- justo esa columna. La policy vieja de `org_id` estaba protegida sin
-- querer porque su `with check` era auto-referencial; acá hace falta un
-- grant a nivel columna explícito.

create policy "users can view own profile and org-mates" on users
  for select using (
    id = auth.uid()
    or exists (select 1 from org_members m where m.org_id = auth_org_id() and m.user_id = users.id)
  );

create policy "users can update own profile" on users
  for update using (id = auth.uid()) with check (id = auth.uid());

revoke update on users from authenticated;
grant update (full_name, avatar_url) on users to authenticated;

-- ============================================================
-- 10. Policies de org_members
-- ============================================================
-- Sin policy de insert/delete para `authenticated`: alta/baja de miembros
-- sigue siendo exclusiva de las edge functions con service role, igual que
-- hoy con `users`.

create policy "see own memberships or current org roster" on org_members
  for select using (user_id = auth.uid() or org_id = auth_org_id());

create policy "owner edits roles in their org" on org_members
  for update using (org_id = auth_org_id() and auth_role() = 'owner')
  with check (org_id = auth_org_id() and auth_role() = 'owner');

revoke update on org_members from authenticated;
grant update (role) on org_members to authenticated;

-- ============================================================
-- 11. switch_active_org — única vía sancionada para cambiar de org activa
-- ============================================================

create or replace function public.switch_active_org(target_org_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.org_members where user_id = auth.uid() and org_id = target_org_id
  ) then
    raise exception 'No sos miembro de esa organización';
  end if;
  update public.users set active_org_id = target_org_id where id = auth.uid();
end;
$$;

revoke all on function public.switch_active_org(uuid) from public;
grant execute on function public.switch_active_org(uuid) to authenticated;

-- ============================================================
-- 12. my_membership — "quién soy / qué rol tengo en mi org activa"
-- ============================================================

create view public.my_membership
with (security_invoker = true) as
select u.id, u.full_name, u.avatar_url, u.active_org_id, u.created_at, om.role
from public.users u
join public.org_members om on om.user_id = u.id and om.org_id = u.active_org_id
where u.id = auth.uid();

grant select on public.my_membership to authenticated;

-- ============================================================
-- 13. find_user_id_by_email — solo para las edge functions (service role)
-- ============================================================
-- auth.users no está expuesto por PostgREST. Esta función permite a
-- create-team-member detectar si un email invitado ya tiene cuenta en
-- Compass, sin abrir un oráculo de enumeración de emails al frontend.

create or replace function public.find_user_id_by_email(p_email text)
returns uuid
language sql
security definer
set search_path = public, auth
as $$
  select id from auth.users where lower(email) = lower(p_email) limit 1
$$;

revoke all on function public.find_user_id_by_email(text) from public, anon, authenticated;
grant execute on function public.find_user_id_by_email(text) to service_role;

-- ============================================================
-- 14. handle_new_user() — alta self-service ahora escribe org_members
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_org_name text;
  v_slug text;
begin
  if coalesce((new.raw_user_meta_data->>'invited')::boolean, false) then
    return new;
  end if;

  v_org_name := coalesce(nullif(trim(new.raw_user_meta_data->>'org_name'), ''), 'Mi Agencia');
  v_slug := lower(regexp_replace(v_org_name, '[^a-zA-Z0-9]+', '-', 'g')) || '-' || substr(new.id::text, 1, 8);

  insert into public.orgs (name, slug) values (v_org_name, v_slug)
  returning id into v_org_id;

  insert into public.users (id, active_org_id, full_name)
  values (
    new.id,
    v_org_id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email)
  );

  insert into public.org_members (org_id, user_id, role)
  values (v_org_id, new.id, 'owner');

  return new;
end;
$$;

-- ============================================================
-- 15. Fuera las columnas legacy — seguro recién acá, todo lo que las
-- tocaba ya fue redefinido arriba en esta misma transacción.
-- ============================================================

alter table users drop column role;
alter table users drop column org_id;
