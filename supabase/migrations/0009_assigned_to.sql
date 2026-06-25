-- Add assigned_to column to clients and projects for admin assignment
alter table clients add column assigned_to uuid references users (id) on delete set null;
alter table projects add column assigned_to uuid references users (id) on delete set null;

create index idx_clients_assigned_to on clients (assigned_to);
create index idx_projects_assigned_to on projects (assigned_to);
