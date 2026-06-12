# Prompts

## 1. Agregar Pulso CRM al CV (Claude Cowork)

```
Quiero agregar un proyecto a mi CV. Se llama "Pulso CRM" y es un dashboard interno que
desarrollé para Pulso Studio, una agencia digital en San Juan, Argentina.

Detalles del proyecto:
- CRM + gestión ágil de proyectos + módulo financiero, todo en una sola plataforma.
- Stack: React 19 + Vite, CSS Modules (diseño propio sin librerías UI), React Router v6,
  Zustand para estado de UI, TanStack Query v5 para estado de servidor, Supabase
  (Postgres + Auth + RLS) como backend, @dnd-kit para drag & drop, deploy en Vercel.
- Funcionalidades clave: gestión de clientes, proyectos y tareas con tablero kanban
  (drag & drop), seguimiento financiero (facturas, ingresos y egresos), gestión de
  cuentas/credenciales y documentación interna.
- Arquitectura: separación estricta entre lógica de datos (hooks personalizados con
  TanStack Query) y UI, mutaciones optimistas en el kanban, multi-tenant con Row Level
  Security en Postgres.
- Rol: desarrollo full-stack end-to-end (diseño de base de datos, frontend, deploy).

Por favor:
1. Redactá una entrada para la sección "Proyectos" de mi CV (2-3 líneas, en español e
   inglés), enfocada en impacto y tecnologías usadas.
2. Sugerí 3-4 bullets de logros/responsabilidades con verbos de acción, cuantificando
   donde sea posible (ej: "reduje tiempo de seguimiento de tareas", "centralicé X
   procesos en una sola plataforma").
3. Adaptá el tono según si el CV apunta a roles de frontend, full-stack o producto
   (preguntame cuál es el objetivo si no es obvio).
```

## 2. Agregar Pulso CRM al portfolio (Claude Code)

```
Quiero agregar este proyecto (Pulso CRM) a mi portfolio personal. Es un dashboard
interno para una agencia digital (Pulso Studio, San Juan, Argentina) con CRM, gestión
ágil de proyectos (kanban con drag & drop) y módulo financiero.

Stack: React 19 + Vite, CSS Modules, React Router v6, Zustand, TanStack Query v5,
Supabase (Postgres + Auth + RLS), @dnd-kit, deploy en Vercel.

Mi portfolio está en [ruta o repo del portfolio]. Por favor:
1. Buscá dónde están definidos los demás proyectos en el portfolio (formato, estructura
   de datos, componentes usados) para mantener consistencia.
2. Agregá una nueva entrada para Pulso CRM siguiendo ese mismo formato: título,
   descripción corta, stack tecnológico, y links (demo / repo si corresponde).
3. Si el portfolio usa imágenes/capturas para cada proyecto, decime qué resolución y
   formato necesitás para que pueda generarlas o sacarlas del proyecto actual.
4. No incluyas datos sensibles (URLs de Supabase, claves, etc.) en el contenido público.
```
