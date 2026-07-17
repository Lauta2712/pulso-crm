import { useMemo, useState } from 'react'
import { useContentPosts, useDeleteContentPost } from '../../hooks/useContent'
import { useClients } from '../../hooks/useClients'
import ContentFormModal from '../../components/content/ContentFormModal'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Select from '../../components/ui/Select'
import EmptyState from '../../components/ui/EmptyState'
import Skeleton, { SkeletonTableRows } from '../../components/ui/Skeleton'
import { IconCalendar } from '../../components/ui/icons'
import { useUIStore } from '../../store/useUIStore'
import styles from './Content.module.css'

const STATUS_VARIANT = {
  idea: 'muted',
  draft: 'info',
  review: 'warning',
  approved: 'success',
  published: 'accent',
}

const STATUS_LABEL = {
  idea: 'Idea',
  draft: 'Borrador',
  review: 'En revisión',
  approved: 'Aprobado',
  published: 'Publicado',
}

const PLATFORM_LABEL = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  linkedin: 'LinkedIn',
  twitter: 'Twitter / X',
  youtube: 'YouTube',
  other: 'Otra',
}

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

function getMonthDays(year, month) {
  const first = new Date(year, month, 1)
  const last = new Date(year, month + 1, 0)
  const days = []
  const startDay = first.getDay()

  for (let i = 0; i < startDay; i++) {
    days.push(null)
  }
  for (let d = 1; d <= last.getDate(); d++) {
    days.push(new Date(year, month, d))
  }
  return days
}

export default function ContentCalendar() {
  const [view, setView] = useState('calendar')
  const [clientId, setClientId] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)

  const [currentDate, setCurrentDate] = useState(new Date())
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const filters = useMemo(() => {
    const f = {}
    if (clientId) f.clientId = clientId
    if (statusFilter) f.status = statusFilter
    return f
  }, [clientId, statusFilter])

  const { data: posts, isLoading, isError } = useContentPosts(filters)
  const { data: clients } = useClients()
  const deletePost = useDeleteContentPost()
  const addToast = useUIStore((state) => state.addToast)

  const days = getMonthDays(year, month)

  const postsByDate = useMemo(() => {
    const map = {}
    posts?.forEach((p) => {
      if (!p.scheduled_at) return
      const key = p.scheduled_at.slice(0, 10)
      if (!map[key]) map[key] = []
      map[key].push(p)
    })
    return map
  }, [posts])

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))

  const monthLabel = currentDate.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })

  const handleDelete = async (post) => {
    if (!window.confirm(`¿Eliminar "${post.title}"?`)) return
    try {
      await deletePost.mutateAsync(post.id)
      addToast('Publicación eliminada')
    } catch {
      addToast('No se pudo eliminar', 'error')
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Calendario de contenido</h1>
        <Button onClick={() => setShowModal(true)}>+ Nueva publicación</Button>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.filters}>
          <Select value={clientId} onChange={setClientId} className={styles.filterSelect}>
            <option value="">Todos los clientes</option>
            {clients?.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
          <Select value={statusFilter} onChange={setStatusFilter} className={styles.filterSelect}>
            <option value="">Todos los estados</option>
            {Object.entries(STATUS_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
        </div>
        <div className={styles.viewToggle}>
          <button
            className={[styles.viewBtn, view === 'calendar' ? styles.viewBtnActive : ''].join(' ')}
            onClick={() => setView('calendar')}
          >
            Calendario
          </button>
          <button
            className={[styles.viewBtn, view === 'list' ? styles.viewBtnActive : ''].join(' ')}
            onClick={() => setView('list')}
          >
            Lista
          </button>
        </div>
      </div>

      {isLoading && view === 'calendar' && (
        <div className={styles.calendarWrapper}>
          <div className={styles.calendarNav}>
            <Skeleton width="60px" height="28px" />
            <Skeleton width="140px" height="18px" />
            <Skeleton width="60px" height="28px" />
          </div>
          <div className={styles.calendarGrid}>
            {DAYS.map((d) => (
              <div key={d} className={styles.dayHeader}>{d}</div>
            ))}
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className={styles.dayCell}>
                <Skeleton width="16px" height="12px" />
              </div>
            ))}
          </div>
        </div>
      )}

      {isLoading && view === 'list' && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Título</th>
                <th>Plataforma</th>
                <th>Cliente</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <SkeletonTableRows columns={6} />
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && (isError || posts?.length === 0) && (
        <EmptyState
          icon={<IconCalendar />}
          title="No hay publicaciones"
          description="Planificá el contenido de redes sociales de tus clientes."
          action={<Button onClick={() => setShowModal(true)}>+ Nueva publicación</Button>}
        />
      )}

      {!isLoading && !isError && posts?.length > 0 && view === 'calendar' && (
        <div className={styles.calendarWrapper}>
          <div className={styles.calendarNav}>
            <button className={styles.navBtn} onClick={prevMonth}>&larr;</button>
            <span className={styles.monthLabel}>{monthLabel}</span>
            <button className={styles.navBtn} onClick={nextMonth}>&rarr;</button>
          </div>
          <div className={styles.calendarGrid}>
            {DAYS.map((d) => (
              <div key={d} className={styles.dayHeader}>{d}</div>
            ))}
            {days.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} className={styles.dayCell} />
              const key = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`
              const dayPosts = postsByDate[key] || []
              const isToday = key === new Date().toISOString().slice(0, 10)
              return (
                <div key={key} className={[styles.dayCell, isToday ? styles.today : ''].join(' ')}>
                  <span className={styles.dayNumber}>{day.getDate()}</span>
                  {dayPosts.map((p) => (
                    <button
                      key={p.id}
                      className={styles.calendarPost}
                      onClick={() => setEditing(p)}
                      title={`${PLATFORM_LABEL[p.platform]} — ${p.title}`}
                    >
                      <Badge variant={STATUS_VARIANT[p.status]} className={styles.calendarBadge}>
                        {PLATFORM_LABEL[p.platform]?.slice(0, 2)}
                      </Badge>
                      <span className={styles.calendarPostTitle}>{p.title}</span>
                    </button>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {!isLoading && !isError && posts?.length > 0 && view === 'list' && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Título</th>
                <th>Plataforma</th>
                <th>Cliente</th>
                <th>Estado</th>
                <th>Fecha</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id}>
                  <td className={styles.name}>{post.title}</td>
                  <td><Badge variant="info">{PLATFORM_LABEL[post.platform]}</Badge></td>
                  <td className={styles.muted}>{post.clients?.name ?? '—'}</td>
                  <td><Badge variant={STATUS_VARIANT[post.status]}>{STATUS_LABEL[post.status]}</Badge></td>
                  <td className={styles.muted}>
                    {post.scheduled_at
                      ? new Date(post.scheduled_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                      : '—'}
                  </td>
                  <td className={styles.actions}>
                    <Button variant="ghost" size="sm" onClick={() => setEditing(post)}>Editar</Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(post)}>Eliminar</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && <ContentFormModal onClose={() => setShowModal(false)} />}
      {editing && <ContentFormModal post={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}
