import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import styles from './AppLayout.module.css'

export default function AppLayout() {
  return (
    <div>
      <Sidebar />
      <div className={styles.content}>
        <TopBar />
        <main className={styles.main}>
          <Outlet />
        </main>
      </div>
    </div>
  )
}
