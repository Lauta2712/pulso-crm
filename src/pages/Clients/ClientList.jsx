import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useClients } from '../../hooks/useClients'
import ClientStatusBadge from '../../components/clients/ClientStatusBadge'
import ClientFormModal from '../../components/clients/ClientFormModal'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import { SkeletonTableRows, SkeletonCard } from '../../components/ui/Skeleton'
import { IconUsers } from '../../components/ui/icons'
import { formatDate } from '../../lib/format'
import { interactiveRowProps } from '../../lib/a11y'
import styles from './Clients.module.css'

const TABS = [
  { value: 'all', label: 'Todos' },
  { value: 'active', label: 'Activos' },
  { value: 'prospect', label: 'Prospectos' },
  { value: 'inactive', label: 'Inactivos' },
  { value: 'churned', label: 'Churned' },
]

export default function ClientList() {
  const { data: clients, isLoading, isError } = useClients()
  const [tab, setTab] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const navigate = useNavigate()

  const filtered = useMemo(() => {
    if (!clients) return []
    if (tab === 'all') return clients
    return clients.filter((c) => c.status === tab)
  }, [clients, tab])

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Clientes</h1>
        <Button onClick={() => setShowModal(true)}>+ Nuevo cliente</Button>
      </div>

      <div className={styles.tabs}>
        {TABS.map((t) => (
          <button
            key={t.value}
            className={[styles.tab, tab === t.value ? styles.tabActive : ''].join(' ')}
            onClick={() => setTab(t.value)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Empresa</th>
                  <th>Estado</th>
                  <th>Responsable</th>
                  <th>Primer contacto</th>
                  <th>Proyectos activos</th>
                </tr>
              </thead>
              <tbody>
                <SkeletonTableRows columns={6} />
              </tbody>
            </table>
          </div>
          <div className={styles.clientCards}>
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} lines={4} className={styles.clientCard} />
            ))}
          </div>
        </>
      )}
      {isError && <p style={{ color: 'var(--danger)' }}>Error al cargar los clientes.</p>}

      {!isLoading && !isError && filtered.length === 0 && (
        <EmptyState
          icon={<IconUsers />}
          title="No hay clientes"
          description="Todavía no cargaste clientes en esta categoría."
          action={<Button onClick={() => setShowModal(true)}>+ Nuevo cliente</Button>}
        />
      )}

      {!isLoading && !isError && filtered.length > 0 && (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Empresa</th>
                  <th>Estado</th>
                  <th>Responsable</th>
                  <th>Primer contacto</th>
                  <th>Proyectos activos</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((client) => {
                  const activeProjects =
                    client.projects?.filter((p) => p.status === 'active').length ?? 0
                  return (
                    <tr
                      key={client.id}
                      className={styles.row}
                      onClick={() => navigate(`/app/clients/${client.id}`)}
                      {...interactiveRowProps(() => navigate(`/app/clients/${client.id}`))}
                    >
                      <td className={styles.clientName}>{client.name}</td>
                      <td className={styles.muted}>{client.company || '—'}</td>
                      <td>
                        <ClientStatusBadge status={client.status} />
                      </td>
                      <td className={styles.muted}>{client.users?.full_name ?? '—'}</td>
                      <td className={styles.muted}>{formatDate(client.first_contact)}</td>
                      <td className={styles.muted}>{activeProjects}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className={styles.clientCards}>
            {filtered.map((client) => {
              const activeProjects =
                client.projects?.filter((p) => p.status === 'active').length ?? 0
              return (
                <div
                  key={client.id}
                  className={['card', styles.clientCard].join(' ')}
                  onClick={() => navigate(`/app/clients/${client.id}`)}
                  {...interactiveRowProps(() => navigate(`/app/clients/${client.id}`))}
                >
                  <div className={styles.clientCardHeader}>
                    <span className={styles.clientName}>{client.name}</span>
                    <ClientStatusBadge status={client.status} />
                  </div>
                  <div className={styles.clientCardRow}>
                    <span className={styles.clientCardLabel}>Empresa</span>
                    <span className={styles.muted}>{client.company || '—'}</span>
                  </div>
                  <div className={styles.clientCardRow}>
                    <span className={styles.clientCardLabel}>Responsable</span>
                    <span className={styles.muted}>{client.users?.full_name ?? '—'}</span>
                  </div>
                  <div className={styles.clientCardRow}>
                    <span className={styles.clientCardLabel}>Primer contacto</span>
                    <span className={styles.muted}>{formatDate(client.first_contact)}</span>
                  </div>
                  <div className={styles.clientCardRow}>
                    <span className={styles.clientCardLabel}>Proyectos activos</span>
                    <span className={styles.muted}>{activeProjects}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {showModal && <ClientFormModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
