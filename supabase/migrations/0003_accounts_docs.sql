-- Pulso CRM — accounts (credenciales) and documents registries

create table accounts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs (id) on delete cascade,
  name text not null,
  category text,
  url text,
  username text,
  password text,
  notes text,
  created_at timestamptz not null default now()
);

create table documents (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references orgs (id) on delete cascade,
  title text not null,
  category text,
  url text,
  notes text,
  created_at timestamptz not null default now()
);

create index idx_accounts_org on accounts (org_id);
create index idx_documents_org on documents (org_id);

alter table accounts enable row level security;
alter table documents enable row level security;

create policy "org members access accounts" on accounts
  for all using (org_id = auth_org_id()) with check (org_id = auth_org_id());

create policy "org members access documents" on documents
  for all using (org_id = auth_org_id()) with check (org_id = auth_org_id());
