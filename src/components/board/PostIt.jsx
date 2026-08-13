import { useEffect, useRef, useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { IconCheck, IconClose } from '../ui/icons'
import styles from './PostIt.module.css'

function rotationFor(id) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0
  return (Math.abs(hash) % 7) - 3
}

export default function PostIt({ note, onSave, onToggleDone, onDelete, done = false, justCreated = false }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: note.id,
    disabled: done,
  })
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(note.title)
  const textareaRef = useRef(null)

  useEffect(() => {
    if (editing) {
      textareaRef.current?.focus()
      textareaRef.current?.select()
    }
  }, [editing])

  const commitTitle = () => {
    setEditing(false)
    const trimmed = title.trim()
    if (trimmed && trimmed !== note.title) onSave({ title: trimmed })
    else setTitle(note.title)
  }

  const dragTransform = CSS.Transform.toString(transform)
  const style = {
    transform: dragTransform ? `${dragTransform} rotate(var(--rotate))` : undefined,
    transition,
    opacity: isDragging ? 0.4 : undefined,
    '--rotate': `${rotationFor(note.id)}deg`,
    '--note-color': note.color,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={[styles.card, done ? styles.done : '', justCreated ? styles.justCreated : ''].join(' ')}
    >
      <div className={styles.actions}>
        <button
          type="button"
          className={styles.actionBtn}
          title={done ? 'Reabrir' : 'Marcar como hecha'}
          aria-label={done ? 'Reabrir' : 'Marcar como hecha'}
          onClick={(e) => { e.stopPropagation(); onToggleDone(!done) }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <IconCheck />
        </button>
        <button
          type="button"
          className={styles.actionBtn}
          title="Eliminar"
          aria-label="Eliminar"
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <IconClose />
        </button>
      </div>

      {editing ? (
        <textarea
          ref={textareaRef}
          className={styles.textarea}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={commitTitle}
          onPointerDown={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              commitTitle()
            }
            if (e.key === 'Escape') {
              setTitle(note.title)
              setEditing(false)
            }
          }}
        />
      ) : (
        <p
          className={styles.text}
          onClick={() => {
            if (done) return
            setTitle(note.title)
            setEditing(true)
          }}
          onPointerDown={(e) => { if (!done) e.stopPropagation() }}
        >
          {note.title}
        </p>
      )}
    </div>
  )
}
