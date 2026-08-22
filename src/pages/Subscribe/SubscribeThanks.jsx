import { Link } from 'react-router-dom'
import Wordmark from '../../components/ui/Wordmark'
import styles from './Subscribe.module.css'

export default function SubscribeThanks() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/">
          <Wordmark />
        </Link>
      </header>

      <main className={styles.main}>
        <div className={styles.intro}>
          <h1 className={styles.title}>¡Gracias!</h1>
          <p className={styles.subtitle}>
            Recibimos tu pago. Nuestro equipo te va a escribir por email en breve para coordinar
            el alta de tu cuenta en Compass.
          </p>
        </div>
      </main>

      <footer className={styles.footer}>
        <span>© {new Date().getFullYear()} Compass</span>
      </footer>
    </div>
  )
}
