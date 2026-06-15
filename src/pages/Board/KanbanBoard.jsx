import { useMemo, useState } from 'react'
import { useTasks } from '../../hooks/useTasks'
import { useProjects } from '../../hooks/useProjects'
import { useUsers } from '../../hooks/useUsers'
import { useSprints } from '../../hooks/useSprints'
import TaskBoard from '../../components/tasks/TaskBoard'
import TaskModal from '../../components/tasks/TaskModal'
import Select from '../../components/ui/Select'
import SprintBar from '../../components/sprints/SprintBar'
import styles from './Board.module.css'

export default function KanbanBoard() {
  const [projectId, setProjectId] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [sprintId, setSprintId] = useState('')
  const [activeTask, setActiveTask] = useState(null)
  const [creatingStatus, setCreatingStatus] = useState(null)

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
        <Select
          value={projectId}
          onChange={(value) => {
            setProjectId(value)
            setSprintId('')
          }}
          className={styles.filterSelect}
        >
          <option value="">Todos los proyectos</option>
          {projects?.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>

        <Select value={assignedTo} onChange={setAssignedTo} className={styles.filterSelect}>
          <option value="">Todos los asignados</option>
          {users?.map((u) => (
            <option key={u.id} value={u.id}>
              {u.full_name}
            </option>
          ))}
        </Select>

        {projectId && sprints?.length > 0 && (
          <Select value={sprintId} onChange={setSprintId} className={styles.filterSelect}>
            <option value="">Todos los sprints</option>
            {sprints.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        )}
      </div>

      {projectId && <SprintBar projectId={projectId} />}

      {isLoading && <p style={{ color: 'var(--text-secondary)' }}>Cargando...</p>}
      {isError && <p style={{ color: 'var(--danger)' }}>Error al cargar las tareas.</p>}

      {!isLoading && !isError && (
        <TaskBoard
          tasks={tasks ?? []}
          queryKey={queryKey}
          onTaskClick={setActiveTask}
          onAddTask={setCreatingStatus}
        />
      )}

      {activeTask && (
        <TaskModal
          task={activeTask}
          projectId={activeTask.project_id}
          onClose={() => setActiveTask(null)}
        />
      )}

      {creatingStatus && (
        <TaskModal
          defaultStatus={creatingStatus}
          projectId={projectId || undefined}
          onClose={() => setCreatingStatus(null)}
        />
      )}
    </div>
  )
}
