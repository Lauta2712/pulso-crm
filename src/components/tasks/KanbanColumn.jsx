import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import TaskCard from './TaskCard'
import styles from './KanbanColumn.module.css'

export default function KanbanColumn({ column, onTaskClick }) {
  const { setNodeRef } = useDroppable({ id: column.id })

  return (
    <div className={styles.column}>
      <div className={styles.header}>
        <span>{column.label}</span>
        <span className={styles.count}>{column.tasks.length}</span>
      </div>
      <SortableContext items={column.tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className={styles.taskList}>
          {column.tasks.map((task) => (
            <TaskCard key={task.id} task={task} onClick={() => onTaskClick(task)} />
          ))}
        </div>
      </SortableContext>
    </div>
  )
}
