import { NavLink } from 'react-router-dom'
import { useUIStore } from '../../store/useUIStore'
import { useCurrentUser } from '../../hooks/useCurrentUser'
import styles from './Sidebar.module.css'

const NAV_GROUPS = [
  {
    items: [
      { to: '/app', label: 'Dashboard', end: true },
    ],
  },
  {
    label: 'Trabajo',
    items: [
      { to: '/app/clients', label: 'Clientes', roles: ['owner', 'pm'] },
      { to: '/app/projects', label: 'Proyectos' },
      { to: '/app/board', label: 'Board' },
      { to: '/app/calendar', label: 'Calendario', badge: 'NEW' },
    ],
  },
  {
    label: 'Contenido',
    items: [
      { to: '/app/content', label: 'Publicaciones', badge: 'NEW' },
      { to: '/app/campaigns', label: 'Campañas', badge: 'NEW' },
      { to: '/app/ads', label: 'Publicidades', badge: 'NEW' },
      { to: '/app/media', label: 'Media', badge: 'NEW' },
    ],
  },
  {
    label: 'Gestión',
    items: [
      { to: '/app/finance', label: 'Finanzas', badge: 'BETA', roles: ['owner'] },
      { to: '/app/accounts', label: 'Cuentas', roles: ['owner'] },
      { to: '/app/docs', label: 'Docs' },
    ],
  },
  {
    label: 'Equipo',
    items: [
      { to: '/app/team', label: 'Equipo', roles: ['owner', 'pm'] },
      { to: '/app/candidates', label: 'Postulantes', roles: ['owner', 'pm'], badge: 'NEW' },
      { to: '/app/profile', label: 'Perfil' },
      { to: '/app/settings', label: 'Ajustes', roles: ['owner'] },
    ],
  },
]

export default function Sidebar() {
  const sidebarOpen = useUIStore((state) => state.sidebarOpen)
  const closeSidebar = useUIStore((state) => state.closeSidebar)
  const { data: currentUser } = useCurrentUser()

  const filterItems = (items) =>
    items.filter((item) => !item.roles || item.roles.includes(currentUser?.role))

  return (
    <>
      {sidebarOpen && <div className={styles.overlay} onClick={closeSidebar} />}
      <aside className={[styles.sidebar, sidebarOpen ? styles.open : ''].join(' ')}>
        <img className={styles.logo} src="/img/logo_pulso_transparent.png" alt="Pulso Studio" />
        <nav className={styles.nav}>
          {NAV_GROUPS.map((group, gi) => {
            const visible = filterItems(group.items)
            if (visible.length === 0) return null
            return (
              <div key={gi} className={styles.group}>
                {group.label && (
                  <span className={styles.groupLabel}>{group.label}</span>
                )}
                {visible.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    onClick={closeSidebar}
                    className={({ isActive }) =>
                      [styles.link, isActive ? styles.linkActive : ''].join(' ')
                    }
                  >
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className={[styles.badge, styles[item.badge.toLowerCase()]].join(' ')}>
                        {item.badge}
                      </span>
                    )}
                  </NavLink>
                ))}
              </div>
            )
          })}
        </nav>
      </aside>
    </>
  )
}
