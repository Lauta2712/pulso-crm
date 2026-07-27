-- Pulso CRM — candidates (postulantes) registry with CV storage

create type candidate_status as enum ('new', 'contacted', 'interviewing', 'rejected', 'hired');

create table candidates (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null default auth_org_id() references orgs (id) on delete cascade,
  full_name text not null,
  email text,
  phone text,
  position text,
  status candidate_status not null default 'new',
  source text,
  notes text,
  cv_path text,
  cv_filename text,
  created_at timestamptz not null default now()
);

create index idx_candidates_org on candidates (org_id);

alter table candidates enable row level security;

create policy "org members access candidates" on candidates
  for all using (org_id = auth_org_id()) with check (org_id = auth_org_id());

-- Storage: private bucket for CV files, accessible to any authenticated user
-- (single-org app — every authenticated user is a Pulso Studio member).

insert into storage.buckets (id, name, public)
values ('cvs', 'cvs', false)
on conflict (id) do nothing;

create policy "authenticated users manage cv files" on storage.objects
  for all
  using (bucket_id = 'cvs' and auth.role() = 'authenticated')
  with check (bucket_id = 'cvs' and auth.role() = 'authenticated');
