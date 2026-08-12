import { useEffect, useRef, useState } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { IconCheck, IconClose } from '../ui/icons'
import { PIN_COLORS } from './postItColors'
import styles from './PostIt.module.css'

function rotationFor(id) {
  let hash = 0
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0
  return (Math.abs(hash) % 5) - 2
}

export default function PostIt({ note, onSave, onToggleDone, onDelete, done = false, autoEdit = false }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: note.id,
    disabled: done,
  })
  const [editing, setEditing] = useState(autoEdit)
  const [title, setTitle] = useState(note.title)
  const [pickerOpen, setPickerOpen] = useState(false)
  const pickerRef = useRef(null)
  const textareaRef = useRef(null)

  useEffect(() => {
    if (editing) {
      textareaRef.current?.focus()
      textareaRef.current?.select()
    }
  }, [editing])

  useEffect(() => {
    if (!pickerOpen) return
    const handler = (e) => {
      if (!pickerRef.current?.contains(e.target)) setPickerOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [pickerOpen])

  const commitTitle = () => {
    setEditing(false)
    const trimmed = title.trim()
    if (trimmed && trimmed !== note.title) onSave({ title: trimmed })
    else setTitle(note.title)
  }

  const dragTransform = CSS.Transform.toString(transform)
  const style = {
    transform: dragTransform ? `${dragTransform} rotate(var(--rotate))` : 'rotate(var(--rotate))',
    transition,
    opacity: isDragging ? 0.4 : 1,
    '--rotate': `${rotationFor(note.id)}deg`,
    '--pin-color': note.color,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={[styles.note, done ? styles.done : ''].join(' ')}
    >
      <button
        type="button"
        className={styles.pin}
        title="Cambiar color"
        aria-label="Cambiar color"
        onClick={(e) => { e.stopPropagation(); setPickerOpen((v) => !v) }}
        onPointerDown={(e) => e.stopPropagation()}
      />

      {pickerOpen && (
        <div className={styles.colorPicker} ref={pickerRef}>
          {PIN_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className={styles.colorSwatch}
              style={{ background: color }}
              onClick={() => { onSave({ color }); setPickerOpen(false) }}
              onPointerDown={(e) => e.stopPropagation()}
              aria-label={`Color ${color}`}
            />
          ))}
        </div>
      )}

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

      {!editing && (
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
      )}
    </div>
  )
}
