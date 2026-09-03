import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'
import { useUIStore } from '../../store/useUIStore'
import { useCurrentUser } from '../../hooks/useCurrentUser'
import { IconMenu, IconSun, IconMoon } from '../ui/icons'
import UserMenu from './UserMenu'
import styles from './TopBar.module.css'

export default function TopBar() {
  const session = useAuthStore((state) => state.session)
  const signOut = useAuthStore((state) => state.signOut)
  const toggleSidebar = useUIStore((state) => state.toggleSidebar)
  const theme = useUIStore((state) => state.theme)
  const toggleTheme = useUIStore((state) => state.toggleTheme)
  const { data: currentUser } = useCurrentUser()
  const navigate = useNavigate()

  const email = session?.user?.email ?? ''

  const handleSignOut = async () => {
    await signOut()
    navigate('/', { replace: true })
  }

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <button className={styles.menuBtn} onClick={toggleSidebar} aria-label="Abrir menú">
          <IconMenu />
        </button>
      </div>
      <div className={styles.right}>
        <button
          type="button"
          className={styles.themeToggle}
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
        >
          {theme === 'dark' ? <IconSun /> : <IconMoon />}
        </button>
        <UserMenu email={email} role={currentUser?.role} onSignOut={handleSignOut} />
      </div>
    </header>
  )
}
