import { NavLink } from 'react-router-dom'
import { useUIStore } from '../../store/useUIStore'
import { useCurrentUser } from '../../hooks/useCurrentUser'
import { useOrg, useMyMemberships, useSwitchActiveOrg } from '../../hooks/useOrg'
import Select from '../ui/Select'
import {
  IconChart,
  IconUsers,
  IconFolder,
  IconColumns,
  IconCalendar,
  IconImage,
  IconMegaphone,
  IconTag,
  IconVideo,
  IconWallet,
  IconKey,
  IconFileText,
  IconInbox,
  IconSettings,
} from '../ui/icons'
import styles from './Sidebar.module.css'

const ROLE_LABELS = {
  owner: 'Owner',
  pm: 'PM',
  developer: 'Developer',
  designer: 'Designer',
  viewer: 'Viewer',
}

const NAV_GROUPS = [
  {
    items: [
      { to: '/app', label: 'Dashboard', end: true, icon: IconChart },
    ],
  },
  {
    label: 'Trabajo',
    items: [
      { to: '/app/clients', label: 'Clientes', roles: ['owner', 'pm'], icon: IconUsers },
      { to: '/app/projects', label: 'Proyectos', icon: IconFolder },
      { to: '/app/board', label: 'Board', icon: IconColumns },
      { to: '/app/calendar', label: 'Calendario', badge: 'NEW', icon: IconCalendar },
    ],
  },
  {
    label: 'Contenido',
    items: [
      { to: '/app/content', label: 'Publicaciones', badge: 'NEW', icon: IconImage },
      { to: '/app/campaigns', label: 'Campañas', badge: 'NEW', icon: IconMegaphone },
      { to: '/app/ads', label: 'Publicidades', badge: 'NEW', icon: IconTag },
      { to: '/app/media', label: 'Media', badge: 'NEW', icon: IconVideo },
    ],
  },
  {
    label: 'Gestión',
    items: [
      { to: '/app/finance', label: 'Finanzas', badge: 'BETA', roles: ['owner'], icon: IconWallet },
      { to: '/app/accounts', label: 'Cuentas', roles: ['owner'], icon: IconKey },
      { to: '/app/docs', label: 'Docs', icon: IconFileText },
    ],
  },
  {
    label: 'Equipo',
    items: [
      { to: '/app/team', label: 'Equipo', roles: ['owner', 'pm'], icon: IconUsers },
      { to: '/app/candidates', label: 'Postulantes', roles: ['owner', 'pm'], badge: 'NEW', icon: IconInbox },
      { to: '/app/profile', label: 'Perfil', icon: IconUsers },
      { to: '/app/settings', label: 'Ajustes', roles: ['owner'], icon: IconSettings },
    ],
  },
]

export default function Sidebar() {
  const sidebarOpen = useUIStore((state) => state.sidebarOpen)
  const closeSidebar = useUIStore((state) => state.closeSidebar)
  const { data: currentUser } = useCurrentUser()
  const { data: org } = useOrg()
  const { data: memberships } = useMyMemberships()
  const switchActiveOrg = useSwitchActiveOrg()

  const filterItems = (items) =>
    items.filter((item) => !item.roles || item.roles.includes(currentUser?.role))

  return (
    <>
      {sidebarOpen && <div className={styles.overlay} onClick={closeSidebar} />}
      <aside className={[styles.sidebar, sidebarOpen ? styles.open : ''].join(' ')}>
        <div className={styles.workspace}>
          <span className={styles.workspaceLabel}>Organización</span>
          <div className={styles.brand}>
            {org?.logo_url ? (
              <img className={styles.brandAvatar} src={org.logo_url} alt={org.name} />
            ) : (
              <span className={[styles.brandAvatar, styles.brandAvatarFallback].join(' ')}>
                {org?.name?.charAt(0).toUpperCase() ?? '?'}
              </span>
            )}
            {memberships && memberships.length > 1 ? (
              <Select
                value={org?.id}
                onChange={(orgId) => switchActiveOrg.mutate(orgId)}
                className={styles.orgSwitcher}
                disabled={switchActiveOrg.isPending}
              >
                {memberships.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </Select>
            ) : (
              <span className={styles.brandName}>{org?.name ?? 'Cargando...'}</span>
            )}
          </div>
          {currentUser?.role && (
            <span className={styles.roleBadge}>{ROLE_LABELS[currentUser.role] ?? currentUser.role}</span>
          )}
        </div>
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
                    <span className={styles.linkMain}>
                      <item.icon className={styles.linkIcon} />
                      <span className={styles.linkLabel}>{item.label}</span>
                    </span>
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
