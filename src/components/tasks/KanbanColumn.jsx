import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import TaskCard from './TaskCard'
import styles from './KanbanColumn.module.css'

export default function KanbanColumn({ column, onTaskClick, onAddTask, onComplete }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })

  return (
    <div className={styles.column}>
      <div className={styles.header}>
        <span>{column.label}</span>
        <div className={styles.headerRight}>
          <span className={styles.count}>{column.tasks.length}</span>
          <button
            type="button"
            className={styles.addBtn}
            onClick={() => onAddTask(column.id)}
            aria-label={`Nueva tarea en ${column.label}`}
            title="Nueva tarea"
          >
            +
          </button>
        </div>
      </div>
      <SortableContext items={column.tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={[styles.taskList, isOver ? styles.taskListOver : ''].join(' ')}
        >
          {column.tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onClick={() => onTaskClick(task)}
              onComplete={() => onComplete(task)}
            />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}
