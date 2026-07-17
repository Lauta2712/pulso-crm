import { useState } from 'react'
import {
  useChecklistItems,
  useAddChecklistItem,
  useToggleChecklistItem,
  useDeleteChecklistItem,
} from '../../hooks/useChecklist'
import { useUIStore } from '../../store/useUIStore'
import Skeleton from '../ui/Skeleton'
import { IconClose } from '../ui/icons'
import styles from './TaskChecklist.module.css'

export default function TaskChecklist({ taskId }) {
  const [title, setTitle] = useState('')
  const addToast = useUIStore((state) => state.addToast)

  const { data: items, isLoading } = useChecklistItems(taskId)
  const addItem = useAddChecklistItem()
  const toggleItem = useToggleChecklistItem()
  const deleteItem = useDeleteChecklistItem()

  const handleAdd = async (e) => {
    e.preventDefault()
    if (!title.trim()) return
    try {
      await addItem.mutateAsync({ taskId, title: title.trim(), position: items?.length ?? 0 })
      setTitle('')
    } catch {
      addToast('No se pudo agregar el item', 'error')
    }
  }

  const handleToggle = async (item) => {
    try {
      await toggleItem.mutateAsync({ id: item.id, isDone: !item.is_done })
    } catch {
      addToast('No se pudo actualizar el item', 'error')
    }
  }

  const handleDelete = async (item) => {
    try {
      await deleteItem.mutateAsync({ id: item.id, taskId })
    } catch {
      addToast('No se pudo eliminar el item', 'error')
    }
  }

  const done = items?.filter((item) => item.is_done).length ?? 0
  const total = items?.length ?? 0

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <span className={styles.label}>Checklist</span>
        {total > 0 && (
          <span className={styles.count}>
            {done}/{total}
          </span>
        )}
      </div>

      {isLoading && (
        <div className={styles.list}>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} height="16px" width={i === 2 ? '60%' : '90%'} />
          ))}
        </div>
      )}
      {!isLoading && total === 0 && <p className={styles.empty}>Sin items todavía.</p>}

      <ul className={styles.list}>
        {items?.map((item) => (
          <li key={item.id} className={styles.item}>
            <label className={styles.itemLabel}>
              <input
                type="checkbox"
                checked={item.is_done}
                onChange={() => handleToggle(item)}
              />
              <span className={item.is_done ? styles.done : ''}>{item.title}</span>
            </label>
            <button
              type="button"
              className={styles.removeBtn}
              onClick={() => handleDelete(item)}
              aria-label="Eliminar item"
            >
              <IconClose />
            </button>
          </li>
        ))}
      </ul>

      <form className={styles.addForm} onSubmit={handleAdd}>
        <input
          type="text"
          placeholder="Agregar item..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <button type="submit" className={styles.addBtn} disabled={addItem.isPending}>
          Agregar
        </button>
      </form>
    </div>
  )
}
