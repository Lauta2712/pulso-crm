-- Calendar events table for "Calendario Pulso"
create table calendar_events (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default auth_org_id() references orgs (id) on delete cascade,
  title text not null,
  description text,
  event_date date not null,
  color text not null default '#2f6fed',
  project_id uuid references projects (id) on delete set null,
  client_id uuid references clients (id) on delete set null,
  assigned_to uuid references users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index idx_calendar_events_org on calendar_events (org_id);
create index idx_calendar_events_date on calendar_events (event_date);

alter table calendar_events enable row level security;

create policy "org members access calendar_events" on calendar_events
  for all using (org_id = auth_org_id()) with check (org_id = auth_org_id());
