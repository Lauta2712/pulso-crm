import CorkBoard from '../../components/board/CorkBoard'

export default function KanbanBoard() {
  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Board</h1>
      </div>
      <CorkBoard />
    </div>
  )
}
