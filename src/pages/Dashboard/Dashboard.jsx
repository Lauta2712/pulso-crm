import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'
import { useClients } from '../../hooks/useClients'
import { useProjects } from '../../hooks/useProjects'
import { useTasks } from '../../hooks/useTasks'
import { useFinanceSummary } from '../../hooks/useFinance'
import { formatCurrency, formatDate } from '../../lib/format'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import styles from './Dashboard.module.css'

const PRIORITY_VARIANT = {
  low: 'muted',
  medium: 'info',
  high: 'warning',
  urgent: 'danger',
}

function isWithinNextWeek(dateStr) {
  if (!dateStr) return false
  const date = new Date(dateStr)
  const now = new Date()
  const in7days = new Date()
  in7days.setDate(now.getDate() + 7)
  return date >= new Date(now.toDateString()) && date <= in7days
}

export default function Dashboard() {
  const session = useAuthStore((state) => state.session)
  const userId = session?.user?.id

  const { data: clients, isLoading: loadingClients } = useClients()
  const { data: projects, isLoading: loadingProjects } = useProjects()
  const { data: tasks, isLoading: loadingTasks } = useTasks()
  const { data: summary, isLoading: loadingSummary } = useFinanceSummary()

  const isLoading = loadingClients || loadingProjects || loadingTasks || loadingSummary

  if (isLoading) {
    return (
      <div className="page">
        <div className="page-header">
          <h1 className="page-title">Dashboard</h1>
        </div>
        <p style={{ color: 'var(--text-secondary)' }}>Cargando...</p>
      </div>
    )
  }

  const activeClients = clients?.filter((c) => c.status === 'active') ?? []
  const activeProjects = projects?.filter((p) => p.status === 'active') ?? []
  const pendingThisWeek =
    tasks?.filter((t) => t.status !== 'done' && isWithinNextWeek(t.due_date)) ?? []
  const myTasks =
    tasks
      ?.filter((t) => t.assigned_to === userId && t.status !== 'done')
      .sort((a, b) => (a.due_date || '9999').localeCompare(b.due_date || '9999'))
      .slice(0, 5) ?? []

  const socialProjects = activeProjects.filter((p) => p.type === 'social')
  const socialTasks = tasks?.filter(
    (t) => t.status !== 'done' && socialProjects.some((p) => p.id === t.project_id)
  ) ?? []

  const webProjects = activeProjects.filter((p) => p.type === 'web' || p.type === 'system' || p.type === 'saas')
  const webTasks = tasks?.filter(
    (t) => t.status !== 'done' && webProjects.some((p) => p.id === t.project_id)
  ) ?? []

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
      </div>

      <div className={styles.metrics}>
        <div className={['card', styles.metricCard].join(' ')}>
          <span className={styles.metricLabel}>Clientes activos</span>
          <span className={styles.metricValue}>{activeClients.length}</span>
        </div>
        <div className={['card', styles.metricCard].join(' ')}>
          <span className={styles.metricLabel}>Proyectos activos</span>
          <span className={styles.metricValue}>{activeProjects.length}</span>
        </div>
        <div className={['card', styles.metricCard].join(' ')}>
          <span className={styles.metricLabel}>Tareas pendientes esta semana</span>
          <span className={styles.metricValue}>{pendingThisWeek.length}</span>
        </div>
        <div className={['card', styles.metricCard].join(' ')}>
          <span className={styles.metricLabel}>Ingresos del mes</span>
          <span className={styles.metricValue}>{formatCurrency(summary?.income)}</span>
        </div>
        <div className={['card', styles.metricCard].join(' ')}>
          <span className={styles.metricLabel}>Redes / Social</span>
          <span className={styles.metricValue}>{socialProjects.length}</span>
          <span className={styles.metricDetail}>{socialTasks.length} tareas pendientes</span>
        </div>
        <div className={['card', styles.metricCard].join(' ')}>
          <span className={styles.metricLabel}>Sistemas / Web</span>
          <span className={styles.metricValue}>{webProjects.length}</span>
          <span className={styles.metricDetail}>{webTasks.length} tareas pendientes</span>
        </div>
      </div>

      <div className={styles.sections}>
        <div className="card">
          <h2 className={styles.sectionTitle}>Mis tareas</h2>
          {myTasks.length === 0 ? (
            <EmptyState icon="✅" title="No tenés tareas pendientes" />
          ) : (
            <div className={styles.list}>
              {myTasks.map((task) => (
                <div key={task.id} className={styles.listItem}>
                  <div>
                    <div className={styles.itemTitle}>{task.title}</div>
                    <div className={styles.itemMeta}>
                      {task.projects?.name} · {formatDate(task.due_date)}
                    </div>
                  </div>
                  <Badge variant={PRIORITY_VARIANT[task.priority] ?? 'muted'}>
                    {task.priority}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h2 className={styles.sectionTitle}>Proyectos activos</h2>
          {activeProjects.length === 0 ? (
            <EmptyState icon="▣" title="No hay proyectos activos" />
          ) : (
            <div className={styles.list}>
              {activeProjects.map((project) => (
                <Link key={project.id} to={`/app/projects/${project.id}`} className={styles.listItem}>
                  <div>
                    <div className={styles.itemTitle}>{project.name}</div>
                    <div className={styles.itemMeta}>{project.clients?.name ?? 'Sin cliente'}</div>
                  </div>
                  <Badge variant="accent">{project.type}</Badge>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
