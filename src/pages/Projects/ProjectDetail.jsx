import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useProject } from '../../hooks/useProjects'
import { useTasks } from '../../hooks/useTasks'
import { useActiveSprint } from '../../hooks/useSprints'
import TaskBoard from '../../components/tasks/TaskBoard'
import TaskBoardSkeleton from '../../components/tasks/TaskBoardSkeleton'
import TaskModal from '../../components/tasks/TaskModal'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Skeleton from '../../components/ui/Skeleton'
import { IconArrowLeft, IconArrowRight } from '../../components/ui/icons'
import { formatCurrency, formatDate } from '../../lib/format'
import styles from './Projects.module.css'

const STATUS_VARIANT = {
  planning: 'info',
  active: 'success',
  paused: 'warning',
  completed: 'muted',
  cancelled: 'danger',
}

export default function ProjectDetail() {
  const { id } = useParams()
  const { data: project, isLoading, isError } = useProject(id)
  const { data: activeSprint } = useActiveSprint(id)

  const queryKey = useMemo(() => ['tasks', { projectId: id }], [id])
  const { data: tasks, isLoading: loadingTasks } = useTasks({ projectId: id })

  const [tab, setTab] = useState('board')
  const [activeTask, setActiveTask] = useState(null)
  const [showNewTask, setShowNewTask] = useState(false)
  const [creatingStatus, setCreatingStatus] = useState(null)

  if (isLoading) {
    return (
      <div className="page">
        <Link to="/app/projects" className={styles.backLink}>
          <IconArrowLeft /> Volver a proyectos
        </Link>

        <div className={styles.detailHeader}>
          <div>
            <Skeleton width="220px" height="24px" style={{ marginBottom: 'var(--space-sm)' }} />
            <Skeleton width="140px" height="14px" />
          </div>
        </div>

        <div className={styles.infoGrid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.infoItem}>
              <Skeleton width="70px" height="11px" />
              <Skeleton width="90px" height="14px" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (isError || !project) {
    return (
      <div className="page">
        <p style={{ color: 'var(--danger)' }}>No se pudo cargar el proyecto.</p>
      </div>
    )
  }

  const visibleTasks =
    tab === 'sprint' && activeSprint
      ? (tasks ?? []).filter((t) => t.sprint_id === activeSprint.id)
      : tasks ?? []

  return (
    <div className="page">
      <Link to="/app/projects" className={styles.backLink}>
        <IconArrowLeft /> Volver a proyectos
      </Link>

      <div className={styles.detailHeader}>
        <div>
          <h1 className="page-title">{project.name}</h1>
          {project.clients && (
            <Link to={`/app/clients/${project.clients.id}`} className={styles.projectClient}>
              {project.clients.name}
            </Link>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Badge variant={STATUS_VARIANT[project.status] ?? 'muted'}>{project.status}</Badge>
          <Badge variant="accent">{project.type}</Badge>
          <Button onClick={() => setShowNewTask(true)}>+ Nueva tarea</Button>
        </div>
      </div>

      <div className={styles.infoGrid}>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>Presupuesto</span>
          <span className={styles.infoValue}>
            {project.budget ? formatCurrency(project.budget, project.currency) : '—'}
          </span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>Inicio</span>
          <span className={styles.infoValue}>{formatDate(project.start_date)}</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>Fin</span>
          <span className={styles.infoValue}>{formatDate(project.end_date)}</span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>Repositorio</span>
          <span className={styles.infoValue}>
            {project.repo_url ? (
              <a href={project.repo_url} target="_blank" rel="noreferrer">
                Ver repo
              </a>
            ) : (
              '—'
            )}
          </span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>Deploy</span>
          <span className={styles.infoValue}>
            {project.deploy_url ? (
              <a href={project.deploy_url} target="_blank" rel="noreferrer">
                Ver deploy
              </a>
            ) : (
              '—'
            )}
          </span>
        </div>
        <div className={styles.infoItem}>
          <span className={styles.infoLabel}>Responsable</span>
          <span className={styles.infoValue}>{project.users?.full_name ?? '—'}</span>
        </div>
      </div>

      {project.project_members?.length > 0 && (
        <div className={styles.members}>
          {project.project_members.map((member) => (
            <div
              key={member.id}
              className={styles.avatar}
              title={`${member.users?.full_name} (${member.role})`}
            >
              {member.users?.full_name?.charAt(0).toUpperCase()}
            </div>
          ))}
        </div>
      )}

      {activeSprint && (
        <div className={styles.tabs}>
          <button
            className={[styles.tab, tab === 'board' ? styles.tabActive : ''].join(' ')}
            onClick={() => setTab('board')}
          >
            Tablero completo
          </button>
          <button
            className={[styles.tab, tab === 'sprint' ? styles.tabActive : ''].join(' ')}
            onClick={() => setTab('sprint')}
          >
            Sprint actual
          </button>
        </div>
      )}

      {tab === 'sprint' && activeSprint && (
        <div className={['card', styles.sprintInfo].join(' ')}>
          <div className={styles.sprintTitle}>{activeSprint.name}</div>
          <div className={styles.sprintMeta}>
            {activeSprint.goal && <span>{activeSprint.goal} · </span>}
            {formatDate(activeSprint.start_date)} <IconArrowRight /> {formatDate(activeSprint.end_date)}
          </div>
        </div>
      )}

      {loadingTasks ? (
        <TaskBoardSkeleton />
      ) : (
        <TaskBoard tasks={visibleTasks} queryKey={queryKey} onTaskClick={setActiveTask} onAddTask={setCreatingStatus} />
      )}

      {activeTask && (
        <TaskModal task={activeTask} projectId={id} onClose={() => setActiveTask(null)} />
      )}

      {showNewTask && (
        <TaskModal projectId={id} defaultStatus="backlog" onClose={() => setShowNewTask(false)} />
      )}

      {creatingStatus && (
        <TaskModal projectId={id} defaultStatus={creatingStatus} onClose={() => setCreatingStatus(null)} />
      )}
    </div>
  )
}
