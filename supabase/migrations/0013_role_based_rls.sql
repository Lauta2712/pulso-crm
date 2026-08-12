-- Pulso CRM — enforce role restrictions at the database level.
--
-- Until now, role-gated screens (Finanzas, Cuentas, Postulantes, edición de
-- Clientes, Ajustes) were only hidden in the frontend (RoleRoute/Sidebar).
-- RLS only checked org_id, so any authenticated org member — regardless of
-- role — could read or write those tables directly via the Supabase client
-- from the browser console. Worst case: `accounts` stores plaintext
-- credentials, readable by every org member instead of just 'owner'.
--
-- This migration adds an auth_role() helper (mirrors auth_org_id()) and
-- tightens RLS on the tables that back owner/pm-only screens.
--
-- `clients` is the one exception: client name/company is embedded via joins
-- across Projects, Content, Campaigns, Media, Calendar and the client picker
-- in several create forms — all screens open to every role. Fully
-- restricting SELECT would break those. So `clients` keeps org-wide read
-- access and only writes (insert/update/delete) are limited to owner/pm,
-- matching who can actually reach the "Clientes" management screen.

create or replace function auth_role()
returns member_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.users where id = auth.uid()
$$;

-- accounts (credenciales): owner only
drop policy if exists "org members access accounts" on accounts;
create policy "owner access accounts" on accounts
  for all using (org_id = auth_org_id() and auth_role() = 'owner')
  with check (org_id = auth_org_id() and auth_role() = 'owner');

-- candidates (postulantes, PII + CVs): owner and pm
drop policy if exists "org_members_access_candidates" on candidates;
create policy "owner and pm access candidates" on candidates
  for all using (org_id = auth_org_id() and auth_role() in ('owner', 'pm'))
  with check (org_id = auth_org_id() and auth_role() in ('owner', 'pm'));

drop policy if exists "authenticated_manage_cv_files" on storage.objects;
create policy "owner and pm manage cv files" on storage.objects
  for all
  using (bucket_id = 'cvs' and auth_role() in ('owner', 'pm'))
  with check (bucket_id = 'cvs' and auth_role() in ('owner', 'pm'));

-- finance (invoices, transactions, expenses): owner only
drop policy if exists "org members access invoices" on invoices;
create policy "owner access invoices" on invoices
  for all using (org_id = auth_org_id() and auth_role() = 'owner')
  with check (org_id = auth_org_id() and auth_role() = 'owner');

drop policy if exists "org members access transactions" on transactions;
create policy "owner access transactions" on transactions
  for all using (org_id = auth_org_id() and auth_role() = 'owner')
  with check (org_id = auth_org_id() and auth_role() = 'owner');

drop policy if exists "org members access expenses" on expenses;
create policy "owner access expenses" on expenses
  for all using (org_id = auth_org_id() and auth_role() = 'owner')
  with check (org_id = auth_org_id() and auth_role() = 'owner');

-- contacts: only ever joined from the client detail page (owner/pm-gated),
-- never embedded elsewhere — safe to fully restrict.
drop policy if exists "org members access contacts" on contacts;
create policy "owner and pm access contacts" on contacts
  for all using (org_id = auth_org_id() and auth_role() in ('owner', 'pm'))
  with check (org_id = auth_org_id() and auth_role() in ('owner', 'pm'));

-- clients: read stays org-wide (see note above), writes limited to owner/pm.
drop policy if exists "org members access clients" on clients;
create policy "org members view clients" on clients
  for select using (org_id = auth_org_id());
create policy "owner and pm insert clients" on clients
  for insert with check (org_id = auth_org_id() and auth_role() in ('owner', 'pm'));
create policy "owner and pm update clients" on clients
  for update using (org_id = auth_org_id() and auth_role() in ('owner', 'pm'))
  with check (org_id = auth_org_id() and auth_role() in ('owner', 'pm'));
create policy "owner and pm delete clients" on clients
  for delete using (org_id = auth_org_id() and auth_role() in ('owner', 'pm'));

-- orgs: only owner can update org settings (select stays org-wide)
drop policy if exists "org members can update org" on orgs;
create policy "owner can update org" on orgs
  for update using (id = auth_org_id() and auth_role() = 'owner')
  with check (id = auth_org_id() and auth_role() = 'owner');
