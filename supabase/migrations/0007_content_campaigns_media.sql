-- Content calendar, campaigns, and media library tables

-- ============================================================
-- ENUMS
-- ============================================================

create type content_status as enum ('idea', 'draft', 'review', 'approved', 'published');
create type social_platform as enum ('instagram', 'facebook', 'tiktok', 'linkedin', 'twitter', 'youtube', 'other');
create type campaign_status as enum ('draft', 'active', 'paused', 'completed', 'cancelled');
create type campaign_platform as enum ('meta', 'google', 'tiktok', 'linkedin', 'other');
create type asset_type as enum ('image', 'video', 'document', 'design', 'other');

-- ============================================================
-- CONTENT POSTS (calendario de contenido)
-- ============================================================

create table content_posts (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default auth_org_id() references orgs (id) on delete cascade,
  client_id uuid references clients (id) on delete set null,
  project_id uuid references projects (id) on delete set null,
  title text not null,
  body text,
  platform social_platform not null default 'instagram',
  status content_status not null default 'idea',
  scheduled_at timestamptz,
  published_at timestamptz,
  post_url text,
  notes text,
  created_at timestamptz not null default now()
);

create index idx_content_posts_org on content_posts (org_id);
create index idx_content_posts_client on content_posts (client_id);
create index idx_content_posts_scheduled on content_posts (scheduled_at);

-- ============================================================
-- CAMPAIGNS (campañas publicitarias)
-- ============================================================

create table campaigns (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default auth_org_id() references orgs (id) on delete cascade,
  client_id uuid references clients (id) on delete set null,
  project_id uuid references projects (id) on delete set null,
  name text not null,
  platform campaign_platform not null default 'meta',
  status campaign_status not null default 'draft',
  budget numeric,
  spent numeric default 0,
  currency text not null default 'ARS',
  start_date date,
  end_date date,
  objective text,
  notes text,
  url text,
  created_at timestamptz not null default now()
);

create index idx_campaigns_org on campaigns (org_id);
create index idx_campaigns_client on campaigns (client_id);

-- ============================================================
-- MEDIA ASSETS (librería de assets)
-- ============================================================

create table media_assets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default auth_org_id() references orgs (id) on delete cascade,
  client_id uuid references clients (id) on delete set null,
  project_id uuid references projects (id) on delete set null,
  name text not null,
  type asset_type not null default 'image',
  url text not null,
  thumbnail_url text,
  notes text,
  created_at timestamptz not null default now()
);

create index idx_media_assets_org on media_assets (org_id);
create index idx_media_assets_client on media_assets (client_id);

-- ============================================================
-- RLS
-- ============================================================

alter table content_posts enable row level security;
alter table campaigns enable row level security;
alter table media_assets enable row level security;

create policy "org members access content_posts" on content_posts
  for all using (org_id = auth_org_id()) with check (org_id = auth_org_id());

create policy "org members access campaigns" on campaigns
  for all using (org_id = auth_org_id()) with check (org_id = auth_org_id());

create policy "org members access media_assets" on media_assets
  for all using (org_id = auth_org_id()) with check (org_id = auth_org_id());
