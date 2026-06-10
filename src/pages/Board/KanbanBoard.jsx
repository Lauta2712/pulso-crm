import { useMemo, useState } from 'react'
import { useTasks } from '../../hooks/useTasks'
import { useProjects } from '../../hooks/useProjects'
import { useUsers } from '../../hooks/useUsers'
import { useSprints } from '../../hooks/useSprints'
import TaskBoard from '../../components/tasks/TaskBoard'
import TaskModal from '../../components/tasks/TaskModal'
import styles from './Board.module.css'

export default function KanbanBoard() {
  const [projectId, setProjectId] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [sprintId, setSprintId] = useState('')
  const [activeTask, setActiveTask] = useState(null)

  const { data: projects } = useProjects()
  const { data: users } = useUsers()
  const { data: sprints } = useSprints(projectId || undefined)

  const filters = useMemo(() => {
    const f = {}
    if (projectId) f.projectId = projectId
    if (assignedTo) f.assignedTo = assignedTo
    if (sprintId) f.sprintId = sprintId
    return f
  }, [projectId, assignedTo, sprintId])

  const { data: tasks, isLoading, isError } = useTasks(filters)
  const queryKey = useMemo(() => ['tasks', filters], [filters])

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Board</h1>
      </div>

      <div className={styles.filters}>
        <select
          value={projectId}
          onChange={(e) => {
            setProjectId(e.target.value)
            setSprintId('')
          }}
        >
          <option value="">Todos los proyectos</option>
          {projects?.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>

        <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
          <option value="">Todos los asignados</option>
          {users?.map((u) => (
            <option key={u.id} value={u.id}>
              {u.full_name}
            </option>
          ))}
        </select>

        {projectId && sprints?.length > 0 && (
          <select value={sprintId} onChange={(e) => setSprintId(e.target.value)}>
            <option value="">Todos los sprints</option>
            {sprints.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {isLoading && <p style={{ color: 'var(--text-secondary)' }}>Cargando...</p>}
      {isError && <p style={{ color: 'var(--danger)' }}>Error al cargar las tareas.</p>}

      {!isLoading && !isError && (
        <TaskBoard tasks={tasks ?? []} queryKey={queryKey} onTaskClick={setActiveTask} />
      )}

      {activeTask && (
        <TaskModal
          task={activeTask}
          projectId={activeTask.project_id}
          onClose={() => setActiveTask(null)}
        />
      )}
    </div>
  )
}
