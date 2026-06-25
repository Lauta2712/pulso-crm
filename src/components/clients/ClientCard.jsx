import ClientStatusBadge from './ClientStatusBadge'
import { formatDate } from '../../lib/format'
import styles from './ClientCard.module.css'

function SatisfactionStars({ value = 0 }) {
  return (
    <div className={styles.stars}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n > value ? styles.starEmpty : ''}>
          ★
        </span>
      ))}
    </div>
  )
}

export default function ClientCard({ client }) {
  return (
    <div className={['card', styles.card].join(' ')}>
      <div className={styles.header}>
        <div>
          <div className={styles.name}>{client.name}</div>
          {client.company && <div className={styles.company}>{client.company}</div>}
        </div>
        <ClientStatusBadge status={client.status} />
      </div>

      <SatisfactionStars value={client.satisfaction} />

      <div className={styles.meta}>
        {client.email && (
          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>Email</span>
            <span>{client.email}</span>
          </div>
        )}
        {client.phone && (
          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>Teléfono</span>
            <span>{client.phone}</span>
          </div>
        )}
        {client.instagram && (
          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>Instagram</span>
            <span>{client.instagram}</span>
          </div>
        )}
        {client.source && (
          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>Origen</span>
            <span>{client.source}</span>
          </div>
        )}
        <div className={styles.metaRow}>
          <span className={styles.metaLabel}>Primer contacto</span>
          <span>{formatDate(client.first_contact)}</span>
        </div>
        {client.users?.full_name && (
          <div className={styles.metaRow}>
            <span className={styles.metaLabel}>Responsable</span>
            <span>{client.users.full_name}</span>
          </div>
        )}
      </div>
    </div>
  )
}
