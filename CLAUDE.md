# Pulso CRM

Dashboard interno de Pulso Studio (agencia digital, San Juan, Argentina). Equipo de 2 personas
(Lautaro y Agus). CRM + gestión ágil de proyectos + módulo financiero, single-org.

## Stack

- Vite + React 19 (JavaScript, sin TypeScript)
- CSS Modules (sin librerías UI, diseño propio)
- React Router v6
- Zustand (UI state: sesión, sidebar, toasts)
- TanStack Query v5 (server state)
- Supabase JS v2 (Postgres + Auth + RLS)
- @dnd-kit para drag & drop del kanban
- Package manager: **pnpm**
- Deploy: Vercel

## Reglas de implementación (no romper)

1. **Toda la lógica de datos vive en `src/hooks/`**. Nunca hacer `supabase.from(...)` directo en
   componentes/páginas.
2. **TanStack Query para server state, Zustand para UI state.** No mezclar.
3. **Mutaciones optimistas** en el kanban (`useMoveTask` en `useTasks.js`): actualiza la UI al
   instante, persiste en Supabase, revierte si falla.
4. RLS resuelve `org_id` automáticamente vía `auth_org_id()`. **Nunca pasar `org_id` desde el
   frontend.**
5. Estados de loading/error explícitos en cada página. `EmptyState` para listas vacías.
6. Formato moneda: `Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' })` (helper en
   `src/lib/format.js`).
7. Fechas: `Intl.DateTimeFormat('es-AR')` (helper en `src/lib/format.js`).
8. Toasts vía `useUIStore().addToast(message, 'success' | 'error')`.

## Estructura

```
src/
├── lib/          supabase.js, queryClient.js, format.js, invoiceStatus.js
├── store/        useAuthStore (sesión Supabase), useUIStore (sidebar, toasts)
├── hooks/        useClients, useProjects, useTasks, useSprints, useFinance,
│                 useUsers, useTags, useOrg
├── pages/        Dashboard, Clients, Projects, Board, Finance, Settings, Auth
└── components/
    ├── layout/   Sidebar, TopBar, AppLayout
    ├── ui/       Button, Modal, Badge, EmptyState, Toast
    ├── clients/  ClientCard, ClientStatusBadge, ClientFormModal
    ├── projects/ ProjectFormModal
    ├── tasks/    TaskBoard (DnD), KanbanColumn, TaskCard, TaskModal, columns.js
    └── finance/  InvoiceCard, TransactionRow
```

## Base de datos

Schema completo (enums, tablas, RLS, función `auth_org_id()`, trigger de alta de usuario, seed de
la org) en `supabase/migrations/0001_init.sql`. Correrlo en el SQL editor del proyecto Supabase.

Enums clave: `client_status`, `project_status`, `project_type`, `task_priority`,
`invoice_status`, `tx_type`, `member_role`, `kanban_column` (= columnas del board: backlog, todo,
in_progress, in_review, done).

Single-org: hay una sola fila en `orgs` ("Pulso Studio"). El trigger `on_auth_user_created` asigna
automáticamente esa org a cada usuario nuevo de Auth.

## Diseño

Paleta y tokens en `src/styles/variables.css` (oscuro, accent `#7c6af7`). Estética: dashboard de
agencia creativa, no SaaS genérico. Tipografía Inter (400/500/600).

## Infra Supabase

Proyecto **Pulso CRM** vive en una org de Supabase nueva ("Pulso Studio Org") para no consumir los
2 proyectos free ya usados por otros proyectos. Variables en `.env` (ver `.env.example`):
`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`.
