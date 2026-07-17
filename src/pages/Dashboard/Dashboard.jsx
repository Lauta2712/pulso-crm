import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/useAuthStore'
import { useClients } from '../../hooks/useClients'
import { useProjects } from '../../hooks/useProjects'
import { useTasks } from '../../hooks/useTasks'
import { useFinanceSummary } from '../../hooks/useFinance'
import { formatCurrency, formatDate } from '../../lib/format'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import Skeleton, { SkeletonText } from '../../components/ui/Skeleton'
import BarChart from '../../components/dashboard/BarChart'
import { COLUMNS } from '../../components/tasks/columns'
import { IconCheckCircle, IconLayers } from '../../components/ui/icons'
import styles from './Dashboard.module.css'

const PRIORITY_VARIANT = {
  low: 'muted',
  medium: 'info',
  high: 'warning',
  urgent: 'danger',
}

const TYPE_LABEL = {
  web: 'Web',
  system: 'Sistema',
  automation: 'Automatización',
  social: 'Social',
  consulting: 'Consultoría',
  saas: 'SaaS',
  other: 'Otro',
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

        <div className={styles.metrics}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={['card', styles.metricCard].join(' ')}>
              <Skeleton width="60%" height="12px" />
              <Skeleton width="40%" height="26px" />
            </div>
          ))}
        </div>

        <div className={styles.charts}>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card">
              <Skeleton width="50%" height="14px" style={{ marginBottom: 'var(--space-md)' }} />
              <Skeleton height="140px" />
            </div>
          ))}
        </div>

        <div className={styles.sections}>
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="card">
              <Skeleton width="40%" height="15px" style={{ marginBottom: 'var(--space-md)' }} />
              <div className={styles.list}>
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className={styles.listItem}>
                    <SkeletonText lines={2} width="70%" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
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

  const tasksByStage = COLUMNS.map((col) => ({
    label: col.label,
    value: tasks?.filter((t) => t.status === col.id).length ?? 0,
  }))

  const projectsByType = Object.entries(TYPE_LABEL)
    .map(([type, label]) => ({
      label,
      value: activeProjects.filter((p) => p.type === type).length,
    }))
    .filter((row) => row.value > 0)

  const balance = summary?.balance ?? 0

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
          <span
            className={styles.metricDetail}
            style={{ color: balance >= 0 ? 'var(--success)' : 'var(--danger)' }}
          >
            Balance {formatCurrency(balance)}
          </span>
        </div>
      </div>

      <div className={styles.charts}>
        <BarChart title="Tareas por etapa" data={tasksByStage} color="var(--accent)" />
        <BarChart
          title="Proyectos activos por tipo"
          data={projectsByType}
          color="var(--accent-orange)"
          emptyLabel="No hay proyectos activos"
        />
        <BarChart
          title="Ingresos vs gastos (mes)"
          data={[
            { label: 'Ingresos', value: summary?.income ?? 0 },
            { label: 'Gastos', value: summary?.expense ?? 0 },
          ]}
          color="var(--info)"
          formatValue={formatCurrency}
        />
      </div>

      <div className={styles.sections}>
        <div className="card">
          <h2 className={styles.sectionTitle}>Mis tareas</h2>
          {myTasks.length === 0 ? (
            <EmptyState icon={<IconCheckCircle />} title="No tenés tareas pendientes" />
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
            <EmptyState icon={<IconLayers />} title="No hay proyectos activos" />
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
