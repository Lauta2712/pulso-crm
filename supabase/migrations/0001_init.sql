-- Pulso CRM — initial schema
-- Run this in the Supabase SQL editor of the new project (or via `supabase db push`).

create extension if not exists pgcrypto;

-- ============================================================
-- ENUMS
-- ============================================================

create type client_status as enum ('prospect', 'active', 'inactive', 'churned');
create type project_status as enum ('planning', 'active', 'paused', 'completed', 'cancelled');
create type project_type as enum ('web', 'system', 'automation', 'social', 'consulting', 'saas', 'other');
create type task_priority as enum ('low', 'medium', 'high', 'urgent');
create type invoice_status as enum ('draft', 'sent', 'viewed', 'paid', 'overdue', 'cancelled');
create type tx_type as enum ('income', 'expense');
create type member_role as enum ('owner', 'developer', 'designer', 'pm', 'viewer');
create type kanban_column as enum ('backlog', 'todo', 'in_progress', 'in_review', 'done');

-- ============================================================
-- TABLES
-- ============================================================

create table orgs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  logo_url text,
  created_at timestamptz not null default now()
);

create table users (
  id uuid primary key references auth.users (id) on delete cascade,
  org_id uuid not null references orgs (id) on delete cascade,
  full_name text not null,
  avatar_url text,
  role member_role not null default 'developer',
  created_at timestamptz not null default now()
);

create table clients (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs (id) on delete cascade,
  name text not null,
  company text,
  status client_status not null default 'prospect',
  email text,
  phone text,
  instagram text,
  notes text,
  satisfaction smallint check (satisfaction between 1 and 5),
  source text,
  first_contact date,
  created_at timestamptz not null default now()
);

create table contacts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs (id) on delete cascade,
  client_id uuid not null references clients (id) on delete cascade,
  full_name text not null,
  role text,
  email text,
  phone text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);

create table projects (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs (id) on delete cascade,
  client_id uuid references clients (id) on delete set null,
  name text not null,
  description text,
  status project_status not null default 'planning',
  type project_type not null default 'web',
  budget numeric,
  currency text not null default 'ARS',
  start_date date,
  end_date date,
  repo_url text,
  deploy_url text,
  created_at timestamptz not null default now()
);

create table project_members (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs (id) on delete cascade,
  project_id uuid not null references projects (id) on delete cascade,
  user_id uuid not null references users (id) on delete cascade,
  role member_role not null default 'developer',
  created_at timestamptz not null default now(),
  unique (project_id, user_id)
);

create table sprints (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs (id) on delete cascade,
  project_id uuid not null references projects (id) on delete cascade,
  name text not null,
  goal text,
  start_date date,
  end_date date,
  is_active boolean not null default false,
  created_at timestamptz not null default now()
);

create table tasks (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs (id) on delete cascade,
  project_id uuid not null references projects (id) on delete cascade,
  sprint_id uuid references sprints (id) on delete set null,
  assigned_to uuid references users (id) on delete set null,
  title text not null,
  description text,
  status kanban_column not null default 'backlog',
  priority task_priority not null default 'medium',
  story_points smallint,
  due_date date,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table tags (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs (id) on delete cascade,
  name text not null,
  color text not null default '#7c6af7',
  created_at timestamptz not null default now()
);

create table task_tags (
  task_id uuid not null references tasks (id) on delete cascade,
  tag_id uuid not null references tags (id) on delete cascade,
  primary key (task_id, tag_id)
);

create table invoices (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs (id) on delete cascade,
  project_id uuid references projects (id) on delete set null,
  client_id uuid references clients (id) on delete set null,
  number text not null,
  status invoice_status not null default 'draft',
  amount numeric not null,
  currency text not null default 'ARS',
  issued_date date,
  due_date date,
  paid_date date,
  notes text,
  created_at timestamptz not null default now()
);

create table transactions (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs (id) on delete cascade,
  project_id uuid references projects (id) on delete set null,
  invoice_id uuid references invoices (id) on delete set null,
  type tx_type not null,
  amount numeric not null,
  currency text not null default 'ARS',
  date date not null,
  description text,
  category text,
  created_at timestamptz not null default now()
);

create table expenses (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs (id) on delete cascade,
  description text not null,
  amount numeric not null,
  currency text not null default 'ARS',
  date date not null,
  category text,
  recurrent boolean not null default false,
  created_at timestamptz not null default now()
);

-- ============================================================
-- INDEXES
-- ============================================================

create index idx_users_org on users (org_id);
create index idx_clients_org on clients (org_id);
create index idx_contacts_client on contacts (client_id);
create index idx_projects_org on projects (org_id);
create index idx_projects_client on projects (client_id);
create index idx_project_members_project on project_members (project_id);
create index idx_sprints_project on sprints (project_id);
create index idx_tasks_org on tasks (org_id);
create index idx_tasks_project on tasks (project_id);
create index idx_tasks_sprint on tasks (sprint_id);
create index idx_tasks_assigned_to on tasks (assigned_to);
create index idx_tags_org on tags (org_id);
create index idx_invoices_org on invoices (org_id);
create index idx_invoices_client on invoices (client_id);
create index idx_invoices_project on invoices (project_id);
create index idx_transactions_org on transactions (org_id);
create index idx_transactions_project on transactions (project_id);
create index idx_expenses_org on expenses (org_id);

-- ============================================================
-- HELPER: auth_org_id()
-- ============================================================

create or replace function auth_org_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select org_id from public.users where id = auth.uid()
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table orgs enable row level security;
alter table users enable row level security;
alter table clients enable row level security;
alter table contacts enable row level security;
alter table projects enable row level security;
alter table project_members enable row level security;
alter table sprints enable row level security;
alter table tasks enable row level security;
alter table tags enable row level security;
alter table task_tags enable row level security;
alter table invoices enable row level security;
alter table transactions enable row level security;
alter table expenses enable row level security;

-- orgs: members can view and update their own org
create policy "org members can view org" on orgs
  for select using (id = auth_org_id());

create policy "org members can update org" on orgs
  for update using (id = auth_org_id()) with check (id = auth_org_id());

-- users: members can view all users in their org, update any (role mgmt) and their own profile
create policy "org members can view users" on users
  for select using (org_id = auth_org_id());

create policy "org members can update users" on users
  for update using (org_id = auth_org_id()) with check (org_id = auth_org_id());

-- generic org-scoped tables
create policy "org members access clients" on clients
  for all using (org_id = auth_org_id()) with check (org_id = auth_org_id());

create policy "org members access contacts" on contacts
  for all using (org_id = auth_org_id()) with check (org_id = auth_org_id());

create policy "org members access projects" on projects
  for all using (org_id = auth_org_id()) with check (org_id = auth_org_id());

create policy "org members access project_members" on project_members
  for all using (org_id = auth_org_id()) with check (org_id = auth_org_id());

create policy "org members access sprints" on sprints
  for all using (org_id = auth_org_id()) with check (org_id = auth_org_id());

create policy "org members access tasks" on tasks
  for all using (org_id = auth_org_id()) with check (org_id = auth_org_id());

create policy "org members access tags" on tags
  for all using (org_id = auth_org_id()) with check (org_id = auth_org_id());

create policy "org members access invoices" on invoices
  for all using (org_id = auth_org_id()) with check (org_id = auth_org_id());

create policy "org members access transactions" on transactions
  for all using (org_id = auth_org_id()) with check (org_id = auth_org_id());

create policy "org members access expenses" on expenses
  for all using (org_id = auth_org_id()) with check (org_id = auth_org_id());

-- task_tags: no org_id column, scope via the parent task
create policy "org members access task_tags" on task_tags
  for all
  using (exists (select 1 from tasks t where t.id = task_tags.task_id and t.org_id = auth_org_id()))
  with check (exists (select 1 from tasks t where t.id = task_tags.task_id and t.org_id = auth_org_id()));

-- ============================================================
-- NEW USER TRIGGER
-- Single-org setup: every new auth user is attached to the only org.
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, org_id, full_name, role)
  values (
    new.id,
    (select id from public.orgs limit 1),
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    'developer'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- SEED
-- ============================================================

insert into orgs (name, slug) values ('Pulso Studio', 'pulso-studio');
