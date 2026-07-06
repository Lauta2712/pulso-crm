-- Performance tracking for ad campaigns (Publicidades)

create table campaign_metrics (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default auth_org_id() references orgs (id) on delete cascade,
  campaign_id uuid not null references campaigns (id) on delete cascade,
  date date not null,
  impressions integer not null default 0,
  reach integer not null default 0,
  clicks integer not null default 0,
  conversions integer not null default 0,
  spend numeric not null default 0,
  created_at timestamptz not null default now()
);

create index idx_campaign_metrics_org on campaign_metrics (org_id);
create index idx_campaign_metrics_campaign on campaign_metrics (campaign_id);
create unique index idx_campaign_metrics_campaign_date on campaign_metrics (campaign_id, date);

alter table campaign_metrics enable row level security;

create policy "org members access campaign_metrics" on campaign_metrics
  for all using (org_id = auth_org_id()) with check (org_id = auth_org_id());
