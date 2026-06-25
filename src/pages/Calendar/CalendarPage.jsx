import { useMemo, useState } from 'react'
import { useCalendarEvents, useCreateCalendarEvent, useUpdateCalendarEvent, useDeleteCalendarEvent } from '../../hooks/useCalendar'
import { useProjects } from '../../hooks/useProjects'
import { useClients } from '../../hooks/useClients'
import { useUsers } from '../../hooks/useUsers'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import Select from '../../components/ui/Select'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import { useUIStore } from '../../store/useUIStore'
import styles from './Calendar.module.css'

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

const COLORS = [
  '#2f6fed',
  '#7c6af7',
  '#34d399',
  '#fbbf24',
  '#f87171',
  '#ff6100',
  '#60a5fa',
  '#a78bfa',
]

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

function dateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

const EMPTY_FORM = {
  title: '',
  description: '',
  event_date: '',
  color: '#2f6fed',
  project_id: '',
  client_id: '',
  assigned_to: '',
}

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const { data: events, isLoading } = useCalendarEvents(year, month)
  const { data: projects } = useProjects()
  const { data: clients } = useClients()
  const { data: users } = useUsers()
  const createEvent = useCreateCalendarEvent()
  const updateEvent = useUpdateCalendarEvent()
  const deleteEvent = useDeleteCalendarEvent()
  const addToast = useUIStore((state) => state.addToast)

  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)

  const days = getMonthDays(year, month)
  const todayKey = dateKey(new Date())

  const eventsByDate = useMemo(() => {
    const map = {}
    events?.forEach((ev) => {
      const key = ev.event_date
      if (!map[key]) map[key] = []
      map[key].push(ev)
    })
    return map
  }, [events])

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))
  const goToday = () => setCurrentDate(new Date())

  const monthLabel = currentDate.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' })

  const openNew = (date) => {
    const d = date ? dateKey(date) : new Date().toISOString().slice(0, 10)
    setForm({ ...EMPTY_FORM, event_date: d })
    setEditing(null)
    setShowModal(true)
  }

  const openEdit = (ev) => {
    setForm({
      title: ev.title,
      description: ev.description || '',
      event_date: ev.event_date,
      color: ev.color,
      project_id: ev.project_id || '',
      client_id: ev.client_id || '',
      assigned_to: ev.assigned_to || '',
    })
    setEditing(ev)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditing(null)
  }

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  const handleSelectChange = (field) => (value) => setForm((f) => ({ ...f, [field]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      ...form,
      project_id: form.project_id || null,
      client_id: form.client_id || null,
      assigned_to: form.assigned_to || null,
    }

    try {
      if (editing) {
        await updateEvent.mutateAsync({ id: editing.id, ...payload })
        addToast('Evento actualizado')
      } else {
        await createEvent.mutateAsync(payload)
        addToast('Evento creado')
      }
      closeModal()
    } catch {
      addToast('No se pudo guardar el evento', 'error')
    }
  }

  const handleDelete = async () => {
    if (!editing || !window.confirm(`¿Eliminar "${editing.title}"?`)) return
    try {
      await deleteEvent.mutateAsync(editing.id)
      addToast('Evento eliminado')
      closeModal()
    } catch {
      addToast('No se pudo eliminar', 'error')
    }
  }

  return (
    <div className="page">
      {isLoading && <p style={{ color: 'var(--text-secondary)' }}>Cargando...</p>}

      {!isLoading && (
        <div className={styles.calendarWrapper}>
          <div className={styles.calendarNav}>
            <button className={styles.navBtn} onClick={prevMonth}>&larr;</button>
            <span className={styles.monthLabel}>{monthLabel}</span>
            <button className={styles.navBtn} onClick={nextMonth}>&rarr;</button>
            <button className={styles.todayBtn} onClick={goToday}>Hoy</button>
            <Button onClick={() => openNew(null)}>+ Nuevo evento</Button>
          </div>

          <div className={styles.calendarGrid}>
            {DAYS.map((d) => (
              <div key={d} className={styles.dayHeader}>{d}</div>
            ))}
            {days.map((day, i) => {
              if (!day) return <div key={`empty-${i}`} className={styles.emptyCellOuter} />
              const key = dateKey(day)
              const dayEvents = eventsByDate[key] || []
              const isToday = key === todayKey
              const maxVisible = 3
              return (
                <div
                  key={key}
                  className={[styles.dayCell, isToday ? styles.today : ''].join(' ')}
                  onClick={() => openNew(day)}
                >
                  <span className={styles.dayNumber}>{day.getDate()}</span>
                  {dayEvents.slice(0, maxVisible).map((ev) => (
                    <button
                      key={ev.id}
                      className={styles.eventPill}
                      style={{ background: ev.color + '22' }}
                      onClick={(e) => { e.stopPropagation(); openEdit(ev) }}
                      title={ev.title}
                    >
                      <span className={styles.eventDot} style={{ background: ev.color }} />
                      <span className={styles.eventTitle}>{ev.title}</span>
                    </button>
                  ))}
                  {dayEvents.length > maxVisible && (
                    <span className={styles.moreEvents}>+{dayEvents.length - maxVisible} más</span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* {!isLoading && (!events || events.length === 0) && (
        <div style={{ marginTop: 'var(--space-lg)' }}>
          <EmptyState
            icon="📅"
            title="Sin eventos"
            description="Agregá fechas importantes, entregas y reuniones al calendario."
            action={<Button onClick={() => openNew(null)}>+ Nuevo evento</Button>}
          />
        </div>
      )} */}

      {showModal && (
        <Modal title={editing ? 'Editar evento' : 'Nuevo evento'} onClose={closeModal}>
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.field}>
              <label className={styles.label}>Título</label>
              <input value={form.title} onChange={handleChange('title')} required autoFocus />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Descripción</label>
              <textarea
                value={form.description}
                onChange={handleChange('description')}
                rows={2}
                style={{ resize: 'vertical' }}
              />
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>Fecha</label>
                <input
                  type="date"
                  value={form.event_date}
                  onChange={handleChange('event_date')}
                  required
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Responsable</label>
                <Select value={form.assigned_to} onChange={handleSelectChange('assigned_to')}>
                  <option value="">Sin asignar</option>
                  {users?.map((u) => (
                    <option key={u.id} value={u.id}>{u.full_name}</option>
                  ))}
                </Select>
              </div>
            </div>

            <div className={styles.row}>
              <div className={styles.field}>
                <label className={styles.label}>Proyecto</label>
                <Select value={form.project_id} onChange={handleSelectChange('project_id')}>
                  <option value="">Ninguno</option>
                  {projects?.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </Select>
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Cliente</label>
                <Select value={form.client_id} onChange={handleSelectChange('client_id')}>
                  <option value="">Ninguno</option>
                  {clients?.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </Select>
              </div>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>Color</label>
              <div className={styles.colorPicker}>
                {COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={[styles.colorSwatch, form.color === c ? styles.colorSwatchActive : ''].join(' ')}
                    style={{ background: c }}
                    onClick={() => setForm((f) => ({ ...f, color: c }))}
                  />
                ))}
              </div>
            </div>

            <div className={styles.actions}>
              {editing && (
                <Button
                  type="button"
                  variant="ghost"
                  className={styles.deleteBtn}
                  onClick={handleDelete}
                  disabled={deleteEvent.isPending}
                >
                  Eliminar
                </Button>
              )}
              <Button type="button" variant="ghost" onClick={closeModal}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createEvent.isPending || updateEvent.isPending}>
                {editing ? 'Guardar' : 'Crear evento'}
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
