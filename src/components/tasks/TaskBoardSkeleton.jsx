import { COLUMNS } from './columns'
import Skeleton from '../ui/Skeleton'
import boardStyles from './TaskBoard.module.css'
import columnStyles from './KanbanColumn.module.css'

export default function TaskBoardSkeleton() {
  return (
    <div className={boardStyles.board}>
      {COLUMNS.map((col) => (
        <div key={col.id} className={columnStyles.column}>
          <div className={columnStyles.header}>
            <span>{col.label}</span>
          </div>
          <div className={columnStyles.taskList}>
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} height="60px" radius="var(--radius-md)" />
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
