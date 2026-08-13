import { useState } from 'react'
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy, sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable'
import PostIt from './PostIt'
import { PIN_COLORS } from './postItColors'
import Skeleton from '../ui/Skeleton'
import { useUIStore } from '../../store/useUIStore'
import {
  useBoardNotes,
  useCreateBoardNote,
  useUpdateBoardNote,
  useToggleBoardNoteDone,
  useReorderBoardNotes,
  useDeleteBoardNote,
} from '../../hooks/useBoardNotes'
import styles from './CorkBoard.module.css'

export default function CorkBoard() {
  const { data: notes, isLoading, isError } = useBoardNotes()
  const createNote = useCreateBoardNote()
  const updateNote = useUpdateBoardNote()
  const toggleDone = useToggleBoardNoteDone()
  const reorderNotes = useReorderBoardNotes()
  const deleteNote = useDeleteBoardNote()
  const addToast = useUIStore((s) => s.addToast)

  const [showDone, setShowDone] = useState(false)
  const [draft, setDraft] = useState('')
  const [tossed, setTossed] = useState(false)
  const [justCreatedId, setJustCreatedId] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const pending = (notes ?? []).filter((n) => n.status !== 'done')
  const done = (notes ?? []).filter((n) => n.status === 'done')

  const handleAdd = async () => {
    const title = draft.trim()
    if (!title) return

    setDraft('')
    setTossed(true)
    setTimeout(() => setTossed(false), 250)

    try {
      const color = PIN_COLORS[Math.floor(Math.random() * PIN_COLORS.length)]
      const created = await createNote.mutateAsync({ title, color })
      setJustCreatedId(created.id)
      setTimeout(() => setJustCreatedId(null), 400)
    } catch (err) {
      console.error(err)
      setDraft(title)
      addToast(err?.message || 'No se pudo crear la nota', 'error')
    }
  }

  const handleSave = async (id, updates) => {
    try {
      await updateNote.mutateAsync({ id, ...updates })
    } catch (err) {
      console.error(err)
      addToast(err?.message || 'No se pudo guardar la nota', 'error')
    }
  }

  const handleToggleDone = (id, value) => {
    toggleDone.mutate(
      { id, done: value },
      { onError: (err) => addToast(err?.message || 'No se pudo actualizar la nota', 'error') }
    )
  }

  const handleDelete = (id) => {
    deleteNote.mutate(id, {
      onError: (err) => addToast(err?.message || 'No se pudo eliminar la nota', 'error'),
    })
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = pending.findIndex((n) => n.id === active.id)
    const newIndex = pending.findIndex((n) => n.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(pending, oldIndex, newIndex)
    reorderNotes.mutate(reordered.map((n) => n.id), {
      onError: (err) => addToast(err?.message || 'No se pudo reordenar', 'error'),
    })
  }

  if (isError) {
    return <p style={{ color: 'var(--danger)' }}>Error al cargar el board.</p>
  }

  return (
    <div className={styles.wrapper}>
      {done.length > 0 && (
        <div className={styles.toolbar}>
          <button type="button" className={styles.doneToggle} onClick={() => setShowDone((v) => !v)}>
            {showDone ? 'Ocultar completadas' : `Ver completadas (${done.length})`}
          </button>
        </div>
      )}

      <div className={styles.composeRow}>
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault()
              handleAdd()
            }
          }}
          placeholder="Escribí algo pendiente y apretá Enter..."
          className={[styles.compose, tossed ? styles.tossed : ''].join(' ')}
          rows={2}
        />
      </div>

      {isLoading ? (
        <div className={styles.board}>
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} height="110px" radius="3px 3px 10px 3px" />
          ))}
        </div>
      ) : pending.length === 0 ? (
        <div className={styles.board}>
          <p className={styles.empty}>Nada pendiente todavía — escribí arriba.</p>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={pending.map((n) => n.id)} strategy={rectSortingStrategy}>
            <div className={styles.board}>
              {pending.map((note) => (
                <PostIt
                  key={note.id}
                  note={note}
                  justCreated={note.id === justCreatedId}
                  onSave={(updates) => handleSave(note.id, updates)}
                  onToggleDone={(value) => handleToggleDone(note.id, value)}
                  onDelete={() => handleDelete(note.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {showDone && done.length > 0 && (
        <div className={styles.doneSection}>
          <div className={styles.board}>
            {done.map((note) => (
              <PostIt
                key={note.id}
                note={note}
                done
                onSave={(updates) => handleSave(note.id, updates)}
                onToggleDone={(value) => handleToggleDone(note.id, value)}
                onDelete={() => handleDelete(note.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
