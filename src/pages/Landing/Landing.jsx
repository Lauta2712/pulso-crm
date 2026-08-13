import { Link, Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'
import Button from '../../components/ui/Button'
import Wordmark from '../../components/ui/Wordmark'
import {
  IconUsers,
  IconLayers,
  IconColumns,
  IconWallet,
  IconKey,
  IconFileText,
  IconCheck,
} from '../../components/ui/icons'
import styles from './Landing.module.css'

const FEATURES = [
  {
    icon: <IconUsers />,
    title: 'Clientes',
    description: 'Toda la info de cada cliente, estado de la relación y contactos clave en un solo lugar.',
  },
  {
    icon: <IconLayers />,
    title: 'Proyectos',
    description: 'Seguimiento de cada proyecto: tipo, estado, presupuesto y entregables.',
  },
  {
    icon: <IconColumns />,
    title: 'Board ágil',
    description: 'Kanban con drag & drop para organizar el trabajo del equipo sprint a sprint.',
  },
  {
    icon: <IconWallet />,
    title: 'Finanzas',
    description: 'Facturas, ingresos y egresos para tener el pulso financiero de la agencia siempre claro.',
  },
  {
    icon: <IconKey />,
    title: 'Cuentas',
    description: 'Accesos y credenciales de clientes y proveedores, centralizados y seguros.',
  },
  {
    icon: <IconFileText />,
    title: 'Docs',
    description: 'Documentación interna y de proyectos, a un click de distancia.',
  },
]

const PLANS = [
  {
    name: 'Starter',
    price: 19,
    priceArs: '29.500',
    description: 'Para agencias que recién arrancan a ordenar el laburo.',
    features: [
      'Hasta 3 usuarios',
      'Clientes, proyectos y board sin límite',
      'Docs y cuentas centralizadas',
      'Soporte por email',
    ],
  },
  {
    name: 'Growth',
    price: 39,
    priceArs: '60.500',
    description: 'Para agencias que ya facturan y necesitan control financiero.',
    features: [
      'Hasta 8 usuarios',
      'Todo lo de Starter',
      'Módulo financiero: facturas, ingresos y egresos',
      'Contenido, campañas y publicidad',
      'Soporte prioritario',
    ],
    highlighted: true,
  },
]

export default function Landing() {
  const session = useAuthStore((state) => state.session)

  if (session) return <Navigate to="/app" replace />

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Wordmark />
      </header>

      <main>
        <section className={styles.hero}>
          <span className={styles.badge}>Compass · CRM para agencias</span>
          <h1 className={styles.title}>
            El <span className={styles.accent}>norte</span> de tu agencia
          </h1>
          <p className={styles.subtitle}>
            Clientes, proyectos, tareas y finanzas en un solo lugar. Simple, rápido y hecho para
            agencias chicas que quieren dejar de laburar a los ponchazos.
          </p>
          <div className={styles.actions}>
            <Link to="/signup">
              <Button size="lg">Crear cuenta</Button>
            </Link>
            <Link to="/login">
              <Button size="lg" variant="secondary">
                Ya tengo cuenta
              </Button>
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

        <section className={styles.pricing}>
          <div className={styles.pricingHeader}>
            <h2 className={styles.pricingTitle}>Precios</h2>
            <p className={styles.pricingSubtitle}>
              Un plan por agencia, no por asiento. Sin permanencia, cancelás cuando quieras.
            </p>
          </div>
          <div className={styles.pricingGrid}>
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={[styles.planCard, plan.highlighted ? styles.planCardHighlighted : ''].join(' ')}
              >
                {plan.highlighted && <span className={styles.planBadge}>Más elegido</span>}
                <h3 className={styles.planName}>{plan.name}</h3>
                <p className={styles.planDescription}>{plan.description}</p>
                <div className={styles.planPrice}>
                  <span className={styles.planPriceAmount}>US$ {plan.price}</span>
                  <span className={styles.planPricePeriod}>/mes</span>
                </div>
                <span className={styles.planPriceArs}>≈ ${plan.priceArs} ARS · cotización aprox.</span>
                <ul className={styles.planFeatures}>
                  {plan.features.map((feature) => (
                    <li key={feature}>
                      <IconCheck />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link to="/signup" className={styles.planCtaLink}>
                  <Button variant={plan.highlighted ? 'primary' : 'secondary'} className={styles.planCta}>
                    Crear cuenta
                  </Button>
                </Link>
              </div>
            ))}
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <span>© {new Date().getFullYear()} Compass</span>
      </footer>
    </div>
  )
}
