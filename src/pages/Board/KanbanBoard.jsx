import CorkBoard from '../../components/board/CorkBoard'
import styles from './KanbanBoard.module.css'

export default function KanbanBoard() {
  return (
    <div className={styles.page}>
      <CorkBoard />
    </div>
  )
}
