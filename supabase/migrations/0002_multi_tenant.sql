-- Pulso CRM (Compass) — multi-tenant signup
-- Run this in the SQL editor of the Supabase project, after 0001_init.sql.

-- ============================================================
-- SIGNUP: self-service org creation vs. owner-invited teammates
-- ============================================================
-- handle_new_user used to attach every new auth user to the single seed org.
-- Now it branches on raw_user_meta_data:
--   - invited = true  -> the create-team-member edge function inserts the
--     public.users row itself (with the inviting owner's own org_id), so the
--     trigger does nothing. This keeps org_id assignment for existing orgs
--     entirely server-side/verified — it never trusts client-supplied
--     metadata to join an org, per the "never pass org_id from the frontend"
--     rule.
--   - otherwise -> self-service signup. Always creates a brand-new org and
--     makes the signing-up user its owner. There is no metadata field that
--     lets a client join an *existing* org, so this path can't be used to
--     escalate into another agency's data even though org_name is
--     client-supplied.

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

  insert into public.users (id, org_id, full_name, role)
  values (
    new.id,
    v_org_id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    'owner'
  );

  return new;
end;
$$;

-- ============================================================
-- ROLE-ESCALATION GUARD
-- ============================================================
-- The existing RLS update policy on users only checks org_id, not the
-- caller's own role, so any member could set their own role to 'owner' via
-- a direct update. This trigger closes that regardless of policy wording:
-- changing role now requires the caller to already be an owner of that org.

create or replace function public.enforce_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    if not exists (
      select 1 from public.users
      where id = auth.uid() and role = 'owner' and org_id = old.org_id
    ) then
      raise exception 'Solo el owner puede cambiar roles';
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_enforce_role_change
  before update on public.users
  for each row execute procedure public.enforce_role_change();
