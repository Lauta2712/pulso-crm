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
import EmptyState from '../ui/EmptyState'
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
  const [justCreatedId, setJustCreatedId] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const pending = (notes ?? []).filter((n) => n.status !== 'done')
  const done = (notes ?? []).filter((n) => n.status === 'done')

  const handleAdd = async () => {
    try {
      const color = PIN_COLORS[Math.floor(Math.random() * PIN_COLORS.length)]
      const created = await createNote.mutateAsync({ title: 'Nueva nota', color })
      setJustCreatedId(created.id)
    } catch (err) {
      console.error(err)
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
      {
        onError: (err) => addToast(err?.message || 'No se pudo actualizar la nota', 'error'),
      }
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

  if (isLoading) {
    return (
      <div className={styles.grid}>
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} height="130px" radius="var(--radius-sm)" />
        ))}
      </div>
    )
  }

  if (isError) {
    return <p style={{ color: 'var(--danger)' }}>Error al cargar el corcho.</p>
  }

  return (
    <div className={styles.board}>
      <div className={styles.toolbar}>
        <button type="button" className={styles.doneToggle} onClick={() => setShowDone((v) => !v)}>
          {showDone ? 'Ocultar completadas' : `Ver completadas (${done.length})`}
        </button>
      </div>

      {pending.length === 0 && !showDone ? (
        <EmptyState
          title="El corcho está vacío"
          description="Pegá tu primera idea o tarea suelta."
          action={
            <button type="button" className={styles.addTile} onClick={handleAdd}>
              + Nueva nota
            </button>
          }
        />
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={pending.map((n) => n.id)} strategy={rectSortingStrategy}>
            <div className={styles.grid}>
              {pending.map((note) => (
                <PostIt
                  key={note.id}
                  note={note}
                  autoEdit={note.id === justCreatedId}
                  onSave={(updates) => handleSave(note.id, updates)}
                  onToggleDone={(value) => handleToggleDone(note.id, value)}
                  onDelete={() => handleDelete(note.id)}
                />
              ))}
              <button type="button" className={styles.addTile} onClick={handleAdd}>
                + Nueva nota
              </button>
            </div>
          </SortableContext>
        </DndContext>
      )}

      {showDone && done.length > 0 && (
        <div className={styles.doneSection}>
          <div className={styles.grid}>
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
