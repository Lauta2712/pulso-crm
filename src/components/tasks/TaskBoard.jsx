import { useState } from 'react'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  closestCorners,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import KanbanColumn from './KanbanColumn'
import TaskCard from './TaskCard'
import { COLUMNS } from './columns'
import { useMoveTask } from '../../hooks/useTasks'
import styles from './TaskBoard.module.css'

export default function TaskBoard({ tasks, queryKey, onTaskClick, onAddTask }) {
  const moveTask = useMoveTask()
  const [activeTask, setActiveTask] = useState(null)
  const [activeColumn, setActiveColumn] = useState(COLUMNS[0].id)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  const columns = COLUMNS.map((col) => ({
    ...col,
    tasks: tasks
      .filter((t) => t.status === col.id)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
  }))

  const handleDragStart = (event) => {
    const task = tasks.find((t) => t.id === event.active.id)
    setActiveTask(task)
  }

  const handleDragEnd = (event) => {
    const { active, over } = event
    setActiveTask(null)
    if (!over) return

    const draggedTask = tasks.find((t) => t.id === active.id)
    if (!draggedTask) return

    const overTask = tasks.find((t) => t.id === over.id)
    const targetStatus = overTask ? overTask.status : over.id

    if (!COLUMNS.some((c) => c.id === targetStatus)) return

    const targetTasks = tasks
      .filter((t) => t.status === targetStatus && t.id !== active.id)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))

    let newPosition = targetTasks.length
    if (overTask && overTask.id !== active.id) {
      const idx = targetTasks.findIndex((t) => t.id === overTask.id)
      if (idx !== -1) newPosition = idx
    }

    if (draggedTask.status === targetStatus && draggedTask.position === newPosition) return

    moveTask.mutate({ id: draggedTask.id, status: targetStatus, position: newPosition, queryKey })
  }

  const handleComplete = (task) => {
    if (task.status === 'done') return
    const position = tasks.filter((t) => t.status === 'done').length
    moveTask.mutate({ id: task.id, status: 'done', position, queryKey })
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className={styles.mobileTabs}>
        {columns.map((col) => (
          <button
            key={col.id}
            type="button"
            className={[styles.mobileTab, col.id === activeColumn ? styles.mobileTabActive : ''].join(' ')}
            onClick={() => setActiveColumn(col.id)}
          >
            {col.label}
            <span className={styles.mobileTabCount}>{col.tasks.length}</span>
          </button>
        ))}
      </div>

      <div className={styles.board}>
        {columns.map((col) => (
          <div
            key={col.id}
            className={[styles.columnWrap, col.id === activeColumn ? styles.columnWrapActive : ''].join(' ')}
          >
            <KanbanColumn
              column={col}
              onTaskClick={onTaskClick}
              onAddTask={onAddTask}
              onComplete={handleComplete}
            />
          </div>
        ))}
      </div>
      <DragOverlay>{activeTask && <TaskCard task={activeTask} overlay />}</DragOverlay>
    </DndContext>
  )
}
