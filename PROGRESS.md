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

- Bundle de producción ~578KB (warning de chunk size de Vite, no resuelto — bajo prioridad).
