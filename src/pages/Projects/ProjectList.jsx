import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProjects } from '../../hooks/useProjects'
import ProjectFormModal from '../../components/projects/ProjectFormModal'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { IconArrowRight, IconLayers } from '../../components/ui/icons'
import { interactiveRowProps } from '../../lib/a11y'
import { formatCurrency, formatDate } from '../../lib/format'
import styles from './Projects.module.css'

const STATUS_FILTERS = [
  { value: 'all', label: 'Todos' },
  { value: 'planning', label: 'Planificación' },
  { value: 'active', label: 'Activos' },
  { value: 'paused', label: 'Pausados' },
  { value: 'completed', label: 'Completados' },
  { value: 'cancelled', label: 'Cancelados' },
]

const STATUS_VARIANT = {
  planning: 'info',
  active: 'success',
  paused: 'warning',
  completed: 'muted',
  cancelled: 'danger',
}

export default function ProjectList() {
  const { data: projects, isLoading, isError } = useProjects()
  const [filter, setFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const navigate = useNavigate()

  const filtered = useMemo(() => {
    if (!projects) return []
    if (filter === 'all') return projects
    return projects.filter((p) => p.status === filter)
  }, [projects, filter])

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Proyectos</h1>
        <Button onClick={() => setShowModal(true)}>+ Nuevo proyecto</Button>
      </div>

      <div className={styles.filters}>
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            className={[styles.filter, filter === f.value ? styles.filterActive : ''].join(' ')}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {isLoading && (
        <div className={styles.grid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} lines={4} className={styles.projectCard} />
          ))}
        </div>
      )}
      {isError && <p style={{ color: 'var(--danger)' }}>Error al cargar los proyectos.</p>}

      {!isLoading && !isError && filtered.length === 0 && (
        <EmptyState
          icon={<IconLayers />}
          title="No hay proyectos"
          description="Todavía no hay proyectos en esta categoría."
          action={<Button onClick={() => setShowModal(true)}>+ Nuevo proyecto</Button>}
        />
      )}

      {!isLoading && !isError && filtered.length > 0 && (
        <div className={styles.grid}>
          {filtered.map((project) => (
            <div
              key={project.id}
              className={['card', styles.projectCard].join(' ')}
              onClick={() => navigate(`/app/projects/${project.id}`)}
              style={{ cursor: 'pointer' }}
              {...interactiveRowProps(() => navigate(`/app/projects/${project.id}`))}
            >
              <div className={styles.projectHeader}>
                <div>
                  <div className={styles.projectName}>{project.name}</div>
                  <div className={styles.projectClient}>
                    {project.clients?.name ?? 'Sin cliente'}
                  </div>
                </div>
                <Badge variant={STATUS_VARIANT[project.status] ?? 'muted'}>{project.status}</Badge>
              </div>

              <div className={styles.projectMeta}>
                <Badge variant="muted">{project.type}</Badge>
              </div>

              {project.users?.full_name && (
                <div className={styles.projectMeta}>
                  <Badge variant="muted">{project.users.full_name}</Badge>
                </div>
              )}

              <div className={styles.projectFooter}>
                <span className={styles.dateRange}>
                  {formatDate(project.start_date)} <IconArrowRight /> {formatDate(project.end_date)}
                </span>
                <span className={styles.budget}>
                  {project.budget ? formatCurrency(project.budget, project.currency) : '—'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && <ProjectFormModal onClose={() => setShowModal(false)} />}
    </div>
  )
}
