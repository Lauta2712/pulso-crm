-- Pulso CRM — checklist items for tasks

create table task_checklist_items (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references tasks (id) on delete cascade,
  title text not null,
  is_done boolean not null default false,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create index idx_task_checklist_items_task on task_checklist_items (task_id);

alter table task_checklist_items enable row level security;

-- no org_id column, scope via the parent task
create policy "org members access task_checklist_items" on task_checklist_items
  for all
  using (exists (select 1 from tasks t where t.id = task_checklist_items.task_id and t.org_id = auth_org_id()))
  with check (exists (select 1 from tasks t where t.id = task_checklist_items.task_id and t.org_id = auth_org_id()));
