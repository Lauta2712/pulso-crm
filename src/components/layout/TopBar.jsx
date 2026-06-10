import { useAuthStore } from '../../store/useAuthStore'
import { useUIStore } from '../../store/useUIStore'
import Button from '../ui/Button'
import styles from './TopBar.module.css'

export default function TopBar() {
  const session = useAuthStore((state) => state.session)
  const signOut = useAuthStore((state) => state.signOut)
  const toggleSidebar = useUIStore((state) => state.toggleSidebar)

  const email = session?.user?.email ?? ''
  const initial = email.charAt(0).toUpperCase()

  return (
    <header className={styles.topbar}>
      <div className={styles.left}>
        <button className={styles.menuBtn} onClick={toggleSidebar} aria-label="Abrir menú">
          ☰
        </button>
      </div>
      <div className={styles.right}>
        <div className={styles.user}>
          <div className={styles.avatar}>{initial || '?'}</div>
          <span>{email}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={signOut}>
          Salir
        </Button>
      </div>
    </header>
  )
}
