import { useState } from 'react'
import { Link } from 'react-router-dom'
import Button from '../../components/ui/Button'
import Wordmark from '../../components/ui/Wordmark'
import { IconCheck } from '../../components/ui/icons'
import { useProductPlans, useCreateProductSubscription } from '../../hooks/useProductSubscriptions'
import styles from './Subscribe.module.css'

export default function Subscribe() {
  const { data: plans, isLoading } = useProductPlans()
  const createSubscription = useCreateProductSubscription()

  const [billingCycle, setBillingCycle] = useState('monthly')
  const [selectedPlanId, setSelectedPlanId] = useState(null)
  const [contactName, setContactName] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [orgName, setOrgName] = useState('')
  const [error, setError] = useState('')

  const selectedPlan = plans?.find((plan) => plan.id === selectedPlanId)

  const handleSelectPlan = (planId) => {
    setSelectedPlanId(planId)
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    try {
      const { initPoint } = await createSubscription.mutateAsync({
        planId: selectedPlanId,
        contactName,
        contactEmail,
        orgName,
        billingCycle,
      })
      window.location.href = initPoint
    } catch (err) {
      setError(err.message || 'No pudimos iniciar el checkout, intentá de nuevo')
    }
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/">
          <Wordmark />
        </Link>
      </header>

      <main className={styles.main}>
        <div className={styles.intro}>
          <h1 className={styles.title}>Suscribite a Compass</h1>
          <p className={styles.subtitle}>
            Elegí un plan y te llevamos a Mercado Pago para completar el pago. Después de eso
            nuestro equipo te escribe para dar de alta tu cuenta.
          </p>
        </div>

        <div className={styles.toggle}>
          <button
            type="button"
            className={[styles.toggleOption, billingCycle === 'monthly' ? styles.toggleOptionActive : ''].join(' ')}
            onClick={() => setBillingCycle('monthly')}
          >
            Mensual
          </button>
          <button
            type="button"
            className={[styles.toggleOption, billingCycle === 'yearly' ? styles.toggleOptionActive : ''].join(' ')}
            onClick={() => setBillingCycle('yearly')}
          >
            Anual · 2 meses gratis
          </button>
        </div>

        {isLoading && <p className={styles.loading}>Cargando planes...</p>}

        <div className={styles.pricingGrid}>
          {plans?.map((plan) => {
            const price = billingCycle === 'yearly' ? plan.price_usd_yearly : plan.price_usd_monthly
            const isSelected = plan.id === selectedPlanId
            return (
              <div
                key={plan.id}
                className={[
                  styles.planCard,
                  plan.is_highlighted ? styles.planCardHighlighted : '',
                  isSelected ? styles.planCardSelected : '',
                ].join(' ')}
              >
                {plan.is_highlighted && <span className={styles.planBadge}>Más elegido</span>}
                <h3 className={styles.planName}>{plan.name}</h3>
                <p className={styles.planDescription}>{plan.description}</p>
                <div className={styles.planPrice}>
                  <span className={styles.planPriceAmount}>US$ {price}</span>
                  <span className={styles.planPricePeriod}>/{billingCycle === 'yearly' ? 'año' : 'mes'}</span>
                </div>
                {plan.max_team_members && (
                  <span className={styles.planLimit}>Hasta {plan.max_team_members} usuarios</span>
                )}
                <ul className={styles.planFeatures}>
                  <li>
                    <IconCheck />
                    Clientes, proyectos y board sin límite
                  </li>
                  <li>
                    <IconCheck />
                    Docs y cuentas centralizadas
                  </li>
                </ul>
                <Button
                  variant={isSelected ? 'primary' : 'secondary'}
                  className={styles.planCta}
                  onClick={() => handleSelectPlan(plan.id)}
                >
                  {isSelected ? 'Plan elegido' : 'Elegir este plan'}
                </Button>
              </div>
            )
          })}
        </div>

        {selectedPlan && (
          <form className={styles.form} onSubmit={handleSubmit}>
            <h2 className={styles.formTitle}>Tus datos</h2>
            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.field}>
              <label className={styles.label} htmlFor="contactName">
                Tu nombre
              </label>
              <input
                id="contactName"
                type="text"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Nombre y apellido"
                required
                autoComplete="name"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="orgName">
                Nombre de tu agencia
              </label>
              <input
                id="orgName"
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                placeholder="Mi Agencia"
                required
                autoComplete="organization"
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label} htmlFor="contactEmail">
                Email
              </label>
              <input
                id="contactEmail"
                type="email"
                value={contactEmail}
                onChange={(e) => setContactEmail(e.target.value)}
                placeholder="vos@tuagencia.com"
                required
                autoComplete="email"
              />
            </div>

            <Button type="submit" className={styles.submit} disabled={createSubscription.isPending}>
              {createSubscription.isPending ? 'Redirigiendo a Mercado Pago...' : 'Ir a pagar'}
            </Button>
          </form>
        )}
      </main>

      <footer className={styles.footer}>
        <span>© {new Date().getFullYear()} Compass</span>
      </footer>
    </div>
  )
}
