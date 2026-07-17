import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useClient, useUpdateClient } from '../../hooks/useClients'
import { useUIStore } from '../../store/useUIStore'
import ClientCard from '../../components/clients/ClientCard'
import ProjectFormModal from '../../components/projects/ProjectFormModal'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import Skeleton, { SkeletonText } from '../../components/ui/Skeleton'
import { IconArrowLeft, IconLayers } from '../../components/ui/icons'
import { formatCurrency } from '../../lib/format'
import styles from './Clients.module.css'

const PROJECT_STATUS_VARIANT = {
  planning: 'info',
  active: 'success',
  paused: 'warning',
  completed: 'muted',
  cancelled: 'danger',
}

export default function ClientDetail() {
  const { id } = useParams()
  const { data: client, isLoading, isError } = useClient(id)
  const updateClient = useUpdateClient()
  const addToast = useUIStore((state) => state.addToast)

  const [notes, setNotes] = useState(null)
  const [showProjectModal, setShowProjectModal] = useState(false)

  if (isLoading) {
    return (
      <div className="page">
        <Link to="/app/clients" className={styles.backLink}>
          <IconArrowLeft /> Volver a clientes
        </Link>

        <div className="page-header">
          <Skeleton width="220px" height="24px" />
        </div>

        <div className={styles.detailGrid}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
            <div className="card">
              <SkeletonText lines={4} />
            </div>
            <div className="card">
              <Skeleton width="120px" height="15px" style={{ marginBottom: 'var(--space-md)' }} />
              <SkeletonText lines={2} />
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
            <div className="card">
              <Skeleton width="100px" height="15px" style={{ marginBottom: 'var(--space-md)' }} />
              <SkeletonText lines={3} />
            </div>
            <div className="card">
              <Skeleton width="80px" height="15px" style={{ marginBottom: 'var(--space-md)' }} />
              <Skeleton height="80px" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isError || !client) {
    return (
      <div className="page">
        <p style={{ color: 'var(--danger)' }}>No se pudo cargar el cliente.</p>
      </div>
    )
  }

  const notesValue = notes ?? client.notes ?? ''

  const handleSaveNotes = async () => {
    try {
      await updateClient.mutateAsync({ id: client.id, notes: notesValue })
      addToast('Notas guardadas')
    } catch {
      addToast('No se pudieron guardar las notas', 'error')
    }
  }

  return (
    <div className="page">
      <Link to="/app/clients" className={styles.backLink}>
        <IconArrowLeft /> Volver a clientes
      </Link>

      <div className="page-header">
        <h1 className="page-title">{client.name}</h1>
        <Button onClick={() => setShowProjectModal(true)}>+ Nuevo proyecto</Button>
      </div>

      <div className={styles.detailGrid}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          <ClientCard client={client} />

          <div className="card">
            <h2 className={styles.sectionTitle}>Contactos</h2>
            {client.contacts?.length ? (
              client.contacts.map((contact) => (
                <div key={contact.id} className={styles.contactRow}>
                  <div>
                    <div className={styles.contactName}>
                      {contact.full_name} {contact.is_primary && <Badge variant="accent">Principal</Badge>}
                    </div>
                    <div className={styles.contactMeta}>
                      {contact.role || '—'} · {contact.email || contact.phone || '—'}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p style={{ color: 'var(--text-secondary)', fontSize: 13 }}>Sin contactos cargados.</p>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-lg)' }}>
          <div className="card">
            <h2 className={styles.sectionTitle}>Proyectos</h2>
            {client.projects?.length ? (
              <div className={styles.projectList}>
                {client.projects.map((project) => (
                  <Link key={project.id} to={`/app/projects/${project.id}`} className={styles.projectRow}>
                    <div>
                      <div className={styles.contactName}>{project.name}</div>
                      <div className={styles.contactMeta}>
                        {project.budget ? formatCurrency(project.budget, project.currency) : 'Sin presupuesto'}
                      </div>
                    </div>
                    <Badge variant={PROJECT_STATUS_VARIANT[project.status] ?? 'muted'}>
                      {project.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<IconLayers />}
                title="Sin proyectos"
                description="Este cliente todavía no tiene proyectos asociados."
                action={<Button onClick={() => setShowProjectModal(true)}>+ Nuevo proyecto</Button>}
              />
            )}
          </div>

          <div className="card">
            <h2 className={styles.sectionTitle}>Notas</h2>
            <textarea
              className={styles.notesArea}
              value={notesValue}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Agregá notas sobre este cliente..."
            />
            <div style={{ marginTop: 'var(--space-sm)', display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                size="sm"
                onClick={handleSaveNotes}
                disabled={updateClient.isPending || notesValue === (client.notes ?? '')}
              >
                Guardar notas
              </Button>
            </div>
          </div>
        </div>
      </div>

      {showProjectModal && (
        <ProjectFormModal clientId={client.id} onClose={() => setShowProjectModal(false)} />
      )}
    </div>
  )
}
