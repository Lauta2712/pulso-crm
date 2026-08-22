import { useRef, useState } from 'react'
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
  const [pageDirection, setPageDirection] = useState('next')
  const activeIndexRef = useRef(0)
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

  const goToColumn = (id) => {
    const nextIndex = COLUMNS.findIndex((c) => c.id === id)
    setPageDirection(nextIndex >= activeIndexRef.current ? 'next' : 'prev')
    activeIndexRef.current = nextIndex
    setActiveColumn(id)
  }

  const activeIndex = COLUMNS.findIndex((c) => c.id === activeColumn)
  const goPrev = () => activeIndex > 0 && goToColumn(COLUMNS[activeIndex - 1].id)
  const goNext = () => activeIndex < COLUMNS.length - 1 && goToColumn(COLUMNS[activeIndex + 1].id)

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
            onClick={() => goToColumn(col.id)}
          >
            {col.label}
            <span className={styles.mobileTabCount}>{col.tasks.length}</span>
          </button>
        ))}
      </div>

      <div className={styles.board}>
        {columns.map((col) => {
          const isActive = col.id === activeColumn
          const animationClass = pageDirection === 'next' ? styles.pageEnterNext : styles.pageEnterPrev
          return (
            <div
              key={col.id}
              className={[styles.columnWrap, isActive ? styles.columnWrapActive : '', isActive ? animationClass : '']
                .join(' ')
                .trim()}
            >
              <KanbanColumn
                column={col}
                onTaskClick={onTaskClick}
                onAddTask={onAddTask}
                onComplete={handleComplete}
              />
            </div>
          )
        })}
      </div>

      <div className={styles.paginator}>
        <button
          type="button"
          className={styles.pagerBtn}
          onClick={goPrev}
          disabled={activeIndex === 0}
          aria-label="Columna anterior"
        >
          ‹
        </button>
        <div className={styles.pagerDots}>
          {columns.map((col) => (
            <button
              key={col.id}
              type="button"
              className={[styles.pagerDot, col.id === activeColumn ? styles.pagerDotActive : ''].join(' ')}
              onClick={() => goToColumn(col.id)}
              aria-label={`Ir a ${col.label}`}
            />
          ))}
        </div>
        <button
          type="button"
          className={styles.pagerBtn}
          onClick={goNext}
          disabled={activeIndex === columns.length - 1}
          aria-label="Columna siguiente"
        >
          ›
        </button>
      </div>

      <DragOverlay>{activeTask && <TaskCard task={activeTask} overlay />}</DragOverlay>
    </DndContext>
  )
}
