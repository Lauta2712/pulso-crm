import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Badge from '../ui/Badge'
import { formatDate } from '../../lib/format'
import styles from './TaskCard.module.css'

const PRIORITY_VARIANT = {
  low: 'muted',
  medium: 'info',
  high: 'warning',
  urgent: 'danger',
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
            ✓
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
          {task.assignee && (
            <div className={styles.avatar} title={task.assignee.full_name}>
              {task.assignee.full_name?.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
