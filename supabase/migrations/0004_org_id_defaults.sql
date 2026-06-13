-- Pulso CRM — default org_id to auth_org_id() on org-scoped tables
-- Inserts from the frontend never send org_id (RLS resolves it), but org_id
-- is NOT NULL with no default, so inserts fail before the RLS check runs.

alter table clients alter column org_id set default auth_org_id();
alter table contacts alter column org_id set default auth_org_id();
alter table projects alter column org_id set default auth_org_id();
alter table project_members alter column org_id set default auth_org_id();
alter table sprints alter column org_id set default auth_org_id();
alter table tasks alter column org_id set default auth_org_id();
alter table tags alter column org_id set default auth_org_id();
alter table invoices alter column org_id set default auth_org_id();
alter table transactions alter column org_id set default auth_org_id();
alter table expenses alter column org_id set default auth_org_id();
alter table accounts alter column org_id set default auth_org_id();
alter table documents alter column org_id set default auth_org_id();
