import { NavLink } from 'react-router-dom'
import { useUIStore } from '../../store/useUIStore'
import styles from './Sidebar.module.css'

const NAV_ITEMS = [
  { to: '/app', label: 'Dashboard', icon: '⌂', end: true },
  { to: '/app/clients', label: 'Clientes', icon: '◆' },
  { to: '/app/projects', label: 'Proyectos', icon: '▣' },
  { to: '/app/board', label: 'Board', icon: '☰' },
  { to: '/app/finance', label: 'Finanzas', icon: '$' },
  { to: '/app/accounts', label: 'Cuentas', icon: '🔑' },
  { to: '/app/docs', label: 'Docs', icon: '📄' },
  { to: '/app/settings', label: 'Configuración', icon: '⚙' },
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
              <span className={styles.icon}>{item.icon}</span>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}
