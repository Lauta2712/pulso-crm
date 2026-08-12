import { useEffect, useRef, useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Badge from '../ui/Badge'
import { formatDate } from '../../lib/format'
import { useUsers } from '../../hooks/useUsers'
import { useUpdateTask } from '../../hooks/useTasks'
import { useUIStore } from '../../store/useUIStore'
import { IconCheck } from '../ui/icons'
import styles from './TaskCard.module.css'

const PRIORITY_VARIANT = {
  low: 'muted',
  medium: 'info',
  high: 'warning',
  urgent: 'danger',
}

function AssigneePicker({ task }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const { data: users } = useUsers()
  const updateTask = useUpdateTask()
  const addToast = useUIStore((s) => s.addToast)

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (!ref.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const assign = async (userId) => {
    setOpen(false)
    try {
      await updateTask.mutateAsync({ id: task.id, assigned_to: userId || null })
    } catch (err) {
      console.error(err)
      addToast(err?.message || 'No se pudo asignar', 'error')
    }
  }

  return (
    <div className={styles.assigneeWrap} ref={ref}>
      <button
        type="button"
        className={task.assignee ? styles.avatar : styles.avatarUnset}
        title={task.assignee ? `Asignado: ${task.assignee.full_name}` : 'Sin asignar — clic para asignar'}
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v) }}
        onPointerDown={(e) => e.stopPropagation()}
      >
        {task.assignee ? task.assignee.full_name?.charAt(0).toUpperCase() : '+'}
      </button>

      {open && (
        <div className={styles.picker}>
          {task.assignee && (
            <button className={styles.pickerItem} onClick={() => assign('')}>
              <span className={styles.pickerAvatarEmpty}>—</span>
              Sin asignar
            </button>
          )}
          {users?.map((u) => (
            <button
              key={u.id}
              className={[
                styles.pickerItem,
                task.assignee?.id === u.id ? styles.pickerItemActive : '',
              ].join(' ')}
              onClick={() => assign(u.id)}
            >
              <span className={styles.pickerAvatar}>
                {u.full_name?.charAt(0).toUpperCase()}
              </span>
              {u.full_name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function TaskCard({ task, onClick, onComplete, overlay = false }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    disabled: overlay,
  })

  const style = overlay
    ? undefined
    : {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.4 : 1,
      }

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      style={style}
      {...(overlay ? {} : attributes)}
      {...(overlay ? {} : listeners)}
      className={[styles.card, overlay ? styles.overlay : ''].join(' ')}
      onClick={onClick}
    >
      <div className={styles.titleRow}>
        <div className={styles.title}>{task.title}</div>
        {!overlay && task.status !== 'done' && (
          <button
            type="button"
            className={styles.completeBtn}
            title="Marcar como finalizada"
            aria-label="Marcar como finalizada"
            onClick={(e) => {
              e.stopPropagation()
              onComplete?.()
            }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <IconCheck />
          </button>
        )}
      </div>

      {task.task_tags?.length > 0 && (
        <div className={styles.tags}>
          {task.task_tags.map(({ tags }) =>
            tags ? (
              <span
                key={tags.id}
                className={styles.tag}
                style={{ background: `${tags.color}26`, color: tags.color }}
              >
                {tags.name}
              </span>
            ) : null
          )}
        </div>
      )}

      <div className={styles.footer}>
        <Badge variant={PRIORITY_VARIANT[task.priority] ?? 'muted'}>{task.priority}</Badge>
        <div className={styles.meta}>
          {task.due_date && <span className={styles.due}>{formatDate(task.due_date)}</span>}
          {!overlay && <AssigneePicker task={task} />}
          {overlay && task.assignee && (
            <div className={styles.avatar} title={task.assignee.full_name}>
              {task.assignee.full_name?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
