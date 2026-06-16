import { NavLink } from 'react-router-dom'
import { useUIStore } from '../../store/useUIStore'
import { useCurrentUser } from '../../hooks/useCurrentUser'
import styles from './Sidebar.module.css'

const NAV_ITEMS = [
  { to: '/app', label: 'Dashboard', end: true },
  { to: '/app/clients', label: 'Clientes', roles: ['owner', 'pm'] },
  { to: '/app/projects', label: 'Proyectos' },
  { to: '/app/board', label: 'Board', badge: 'BETA' },
  { to: '/app/finance', label: 'Finanzas', badge: 'BETA', roles: ['owner'] },
  { to: '/app/accounts', label: 'Cuentas', roles: ['owner'] },
  { to: '/app/docs', label: 'Docs' },
  { to: '/app/team', label: 'Equipo', badge: 'NEW', roles: ['owner', 'pm'] },
  { to: '/app/profile', label: 'Perfil' },
  { to: '/app/settings', label: 'Configuración', roles: ['owner'] },
]

export default function Sidebar() {
  const sidebarOpen = useUIStore((state) => state.sidebarOpen)
  const closeSidebar = useUIStore((state) => state.closeSidebar)
  const { data: currentUser } = useCurrentUser()

  const visibleItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(currentUser?.role)
  )

  return (
    <>
      {sidebarOpen && <div className={styles.overlay} onClick={closeSidebar} />}
      <aside className={[styles.sidebar, sidebarOpen ? styles.open : ''].join(' ')}>
        <img className={styles.logo} src="/img/logo_pulso_transparent.png" alt="Pulso Studio" />
        <nav className={styles.nav}>
          {visibleItems.map((item) => (
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
        </nav>
      </aside>
    </>
  )
}
