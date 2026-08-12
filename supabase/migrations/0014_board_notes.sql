-- Corcho de post-its en el Board: las notas sueltas no pertenecen a un
-- proyecto puntual, y cada una tiene un color propio.
alter table tasks alter column project_id drop not null;
alter table tasks add column color text not null default '#7c6af7';
