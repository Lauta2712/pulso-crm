import { NavLink } from 'react-router-dom'
import { useUIStore } from '../../store/useUIStore'
import styles from './Sidebar.module.css'

const NAV_ITEMS = [
  { to: '/app', label: 'Dashboard', end: true },
  { to: '/app/clients', label: 'Clientes' },
  { to: '/app/projects', label: 'Proyectos' },
  { to: '/app/board', label: 'Board', badge: 'BETA' },
  { to: '/app/finance', label: 'Finanzas', badge: 'BETA' },
  { to: '/app/accounts', label: 'Cuentas' },
  { to: '/app/docs', label: 'Docs' },
  { to: '/app/team', label: 'Equipo', badge: 'NEW' },
  { to: '/app/settings', label: 'Configuración' },
]

export default function Sidebar() {
  const sidebarOpen = useUIStore((state) => state.sidebarOpen)
  const closeSidebar = useUIStore((state) => state.closeSidebar)

  return (
    <>
      {sidebarOpen && <div className={styles.overlay} onClick={closeSidebar} />}
      <aside className={[styles.sidebar, sidebarOpen ? styles.open : ''].join(' ')}>
        <img className={styles.logo} src="/img/logo_pulso_transparent.png" alt="Pulso Studio" />
        <nav className={styles.nav}>
          {NAV_ITEMS.map((item) => (
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
