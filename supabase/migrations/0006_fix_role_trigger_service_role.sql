-- El trigger anterior bloqueaba al service role (auth.uid() = null) de
-- cambiar roles, rompiendo la Edge Function create-team-member.
-- Se permite null uid (service role) y solo se restringe a usuarios autenticados no-owner.

create or replace function public.prevent_role_change_by_non_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.role is distinct from old.role then
    if auth.uid() is not null and not exists (
      select 1 from public.users where id = auth.uid() and role = 'owner'
    ) then
      raise exception 'Solo un owner puede cambiar el rol de un usuario';
    end if;
  end if;
  return new;
end;
$$;
