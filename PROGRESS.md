# Progreso — Pulso CRM

## Frontend (completo)

Todas las etapas del build inicial están terminadas, con `pnpm run lint` y `pnpm run build` en
verde:

- [x] 1. Setup (Vite, deps, `.env.example`, lib base: supabase client, queryClient, format, etc.)
- [x] 2. Sistema de diseño (`variables.css`, `global.css`, tipografía Inter)
- [x] 3. Layout + routing (Sidebar, TopBar, AppLayout, rutas privadas)
- [x] 4. Auth (Login, useAuthStore)
- [x] 5. Hooks de datos (clients, projects, tasks, sprints, finance, users, tags, org)
- [x] 6. Dashboard (métricas, mis tareas, proyectos activos)
- [x] 7. Clientes (lista con tabs, detalle, contactos, notas, alta de cliente/proyecto)
- [x] 8. Proyectos + Kanban (lista, detalle, sprint activo, drag & drop con @dnd-kit, TaskModal)
- [x] 9. Board global (filtros por proyecto/asignado/sprint)
- [x] 10. Finanzas (dashboard con métricas, facturas, transacciones, gastos, detalle de factura)
- [x] 11. Configuración (datos de la org, roles de usuario, tags)

UI components (Button, Modal, Badge, EmptyState, Toast) y componentes de dominio (ClientCard,
ProjectFormModal, TaskBoard/TaskCard/TaskModal, InvoiceCard, TransactionRow) implementados.

## Mejoras recientes (completo)

- [x] **Select propio** (`src/components/ui/Select.jsx`): dropdown con menú flotante vía portal,
      reemplaza los `<select>` nativos en Board, TaskModal, Finanzas, Proyectos, Clientes,
      Cuentas, Docs y Configuración para un look consistente con el resto del sistema.
- [x] **Board ágil**: crear tareas desde el "+" de cada columna (con selector de proyecto si no
      hay uno filtrado), marcar tareas como finalizadas con un botón check rápido, y barra de
      sprint activo (`SprintBar`) con progreso y alta de nuevo sprint (`SprintFormModal`).
- [x] **Finanzas**: limpieza de CSS (`Finance.module.css`) — secciones con wrap, dropdowns
      consistentes, contenedor para el estado vacío de facturas.
- [x] **Página "Equipo"** (`src/pages/Team/Team.jsx`): overview de integrantes, rol, tareas
      activas y proyectos asignados (con cliente).
- [x] **Sidebar**: etiquetas "BETA" (Board, Finanzas) y "NEW" (Equipo) para señalar estado de cada
      pantalla.
- [x] **Alta de integrantes desde "Equipo"** (solo owner):
      - `supabase/functions/create-team-member/index.ts` — Edge Function que invita por email
        (`auth.admin.inviteUserByEmail`) y asigna rol, validando que quien llama sea `owner`.
      - `supabase/migrations/0005_role_update_restriction.sql` — trigger que bloquea cambios de
        `role` en `users` si quien actualiza no es `owner`.
      - `src/components/team/InviteMemberModal.jsx` + `useCreateTeamMember` (`useTeam.js`).
      - Configuración → Usuarios: el selector de rol ahora es solo para `owner`s (el resto ve un
        badge de solo lectura).
- [ ] **Pendiente**: deployar la edge function (`supabase functions deploy create-team-member`),
      correr `0005_role_update_restriction.sql`, asegurarse de que tu usuario tenga `role = owner`
      **antes** de correr 0005, y revisar Site URL / Redirect URLs en Auth para el email de
      invitación.

## Módulos de agencia creativa (completo)

- [x] **Calendario de contenido** (`/app/content`): planificación de publicaciones para redes
      sociales por cliente. Vista calendario mensual con posts por día + vista lista. Filtros por
      cliente, estado y plataforma (Instagram, Facebook, TikTok, LinkedIn, Twitter/X, YouTube).
      Estados: idea → borrador → en revisión → aprobado → publicado.
- [x] **Campañas** (`/app/campaigns`): seguimiento de campañas publicitarias (Meta Ads, Google Ads,
      TikTok Ads, LinkedIn Ads). Tabla con barra de progreso presupuesto/gastado, resumen de gasto
      total de campañas activas, filtros por cliente y estado. Estados: borrador, activa, pausada,
      completada, cancelada.
- [x] **Media Library** (`/app/media`): repositorio de assets (imágenes, videos, documentos,
      diseños) organizados por cliente y proyecto. Vista grilla con cards + vista lista. Links a
      archivos externos (Drive, Figma, etc.).
- [x] **Migración SQL**: `0007_content_campaigns_media.sql` — 5 enums nuevos, 3 tablas
      (`content_posts`, `campaigns`, `media_assets`) con RLS, índices y `org_id` default.
- [x] **Hooks**: `useContent.js`, `useCampaigns.js`, `useMedia.js` — CRUD completo con TanStack
      Query.
- [x] **Sidebar**: 3 items nuevos con badge "NEW" (Contenido, Campañas, Media).
- [ ] **Pendiente**: correr `0007_content_campaigns_media.sql` en el SQL Editor de Supabase.

## Backend / Infraestructura (en curso)

- [x] Decisión de hosting: nueva organización de Supabase ("Pulso Studio Org") creada para tener
      un proyecto free disponible sin tocar los otros dos proyectos existentes.
- [x] Proyecto creado: **Pulso CRM** (ref `wjajabqqxpgaocbnfonf`, región us-west-2/Oregon).
- [x] Migración inicial generada: `supabase/migrations/0001_init.sql` (enums, 13 tablas, índices,
      `auth_org_id()`, RLS por org, trigger `handle_new_user`, seed de la org "Pulso Studio").
- [ ] **Pendiente**: correr `0001_init.sql` en el SQL editor del proyecto Pulso CRM.
- [ ] **Pendiente**: completar `.env` con `VITE_SUPABASE_URL` (`https://wjajabqqxpgaocbnfonf.supabase.co`)
      y `VITE_SUPABASE_ANON_KEY` (Project Settings → API → `anon` `public`, **no** usar
      `service_role`).
- [ ] **Pendiente**: crear usuarios de Auth para Lautaro y Agus (Authentication → Users → Add
      user → Create new user, con "Auto Confirm User" activado) — el trigger los asigna
      automáticamente a la org "Pulso Studio".
- [ ] **Pendiente**: probar login end-to-end con `pnpm dev`.

## Diferido (sin acción por ahora)

- Self-hosting de Supabase con Docker — el usuario lo va a investigar por su cuenta más adelante.
  Solo upgrade a plan Pro si llega un cliente nuevo y se necesita un segundo proyecto.

## Notas

- Bundle de producción ~649KB (warning de chunk size de Vite, no resuelto — bajo prioridad).
