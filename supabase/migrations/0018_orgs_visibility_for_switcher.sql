-- El org switcher (useMyMemberships, Sidebar) necesita poder ver el nombre y
-- logo de TODAS las orgs de las que sos miembro, no solo la activa. La
-- policy de 0001_init.sql restringía `orgs` a `id = auth_org_id()` (solo la
-- org activa) — eso rompe el embed `org_members -> orgs(...)` para cualquier
-- fila de una org no-activa: PostgREST hace ese join respetando RLS de
-- `orgs`, así que esas filas quedaban afuera del resultado en silencio.
--
-- auth_org_id() sigue siendo un caso particular de "org de la que sos
-- miembro" (switch_active_org() no deja pisar active_org_id con una org
-- ajena), así que reemplazar la policy por esta no le saca visibilidad a
-- nadie, solo se la agrega para el resto de tus orgs.

drop policy if exists "org members can view org" on orgs;

create policy "members can view any org they belong to" on orgs
  for select using (
    exists (
      select 1 from org_members m
      where m.org_id = orgs.id and m.user_id = auth.uid()
    )
  );
