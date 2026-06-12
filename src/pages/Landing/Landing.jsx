import { Link, Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'
import Button from '../../components/ui/Button'
import styles from './Landing.module.css'

const FEATURES = [
  {
    icon: '◆',
    title: 'Clientes',
    description: 'Toda la info de cada cliente, estado de la relación y contactos clave en un solo lugar.',
  },
  {
    icon: '▣',
    title: 'Proyectos',
    description: 'Seguimiento de cada proyecto: tipo, estado, presupuesto y entregables.',
  },
  {
    icon: '☰',
    title: 'Board ágil',
    description: 'Kanban con drag & drop para organizar el trabajo del equipo sprint a sprint.',
  },
  {
    icon: '$',
    title: 'Finanzas',
    description: 'Facturas, ingresos y egresos para tener el pulso financiero de la agencia siempre claro.',
  },
  {
    icon: '🔑',
    title: 'Cuentas',
    description: 'Accesos y credenciales de clientes y proveedores, centralizados y seguros.',
  },
  {
    icon: '📄',
    title: 'Docs',
    description: 'Documentación interna y de proyectos, a un click de distancia.',
  },
]

export default function Landing() {
  const session = useAuthStore((state) => state.session)

  if (session) return <Navigate to="/app" replace />

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <img className={styles.logo} src="/img/logo_pulso_transparent.png" alt="Pulso Studio" />
        <Link to="/login">
          <Button>Ingresar al sistema</Button>
        </Link>
      </header>

      <main>
        <section className={styles.hero}>
          <span className={styles.badge}>Pulso Studio · CRM interno</span>
          <h1 className={styles.title}>
            El panel de control de <span className={styles.accent}>Pulso Studio</span>
          </h1>
          <p className={styles.subtitle}>
            Clientes, proyectos, tareas y finanzas de la agencia en un solo lugar. Simple,
            rápido y hecho a medida para nuestro equipo.
          </p>
          <div className={styles.actions}>
            <Link to="/login">
              <Button size="lg">Ingresar al sistema</Button>
            </Link>
          </div>
        </section>

        <section className={styles.features}>
          {FEATURES.map((feature) => (
            <div key={feature.title} className={styles.featureCard}>
              <div className={styles.featureIcon}>{feature.icon}</div>
              <h3 className={styles.featureTitle}>{feature.title}</h3>
              <p className={styles.featureDescription}>{feature.description}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className={styles.footer}>
        <span>© {new Date().getFullYear()} Pulso Studio — San Juan, Argentina</span>
      </footer>
    </div>
  )
}
