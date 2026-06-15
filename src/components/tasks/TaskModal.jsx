import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Select from '../ui/Select'
import TaskChecklist from './TaskChecklist'
import { useCreateTask, useUpdateTask, useDeleteTask, useSetTaskTags } from '../../hooks/useTasks'
import { useUsers } from '../../hooks/useUsers'
import { useTags } from '../../hooks/useTags'
import { useProjects } from '../../hooks/useProjects'
import { useSprints } from '../../hooks/useSprints'
import { useUIStore } from '../../store/useUIStore'
import { COLUMNS } from './columns'
import styles from './TaskModal.module.css'

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Baja' },
  { value: 'medium', label: 'Media' },
  { value: 'high', label: 'Alta' },
  { value: 'urgent', label: 'Urgente' },
]

export default function TaskModal({ task, projectId, defaultStatus, onClose }) {
  const isEditing = !!task
  const addToast = useUIStore((state) => state.addToast)

  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()
  const setTaskTags = useSetTaskTags()

  const { data: users } = useUsers()
  const { data: tags } = useTags()
  const { data: projects } = useProjects()

  const [form, setForm] = useState({
    title: task?.title ?? '',
    description: task?.description ?? '',
    status: task?.status ?? defaultStatus ?? 'backlog',
    priority: task?.priority ?? 'medium',
    assigned_to: task?.assigned_to ?? '',
    due_date: task?.due_date ?? '',
    story_points: task?.story_points ?? '',
    sprint_id: task?.sprint_id ?? '',
    project_id: projectId ?? '',
  })

  const effectiveProjectId = form.project_id || projectId
  const { data: sprints } = useSprints(effectiveProjectId)

  const [selectedTags, setSelectedTags] = useState(
    new Set(task?.task_tags?.map(({ tags: t }) => t?.id).filter(Boolean) ?? [])
  )

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  const handleSelectChange = (field) => (value) => setForm((f) => ({ ...f, [field]: value }))

  const toggleTag = (tagId) => {
    setSelectedTags((prev) => {
      const next = new Set(prev)
      if (next.has(tagId)) next.delete(tagId)
      else next.add(tagId)
      return next
    })
  }

  const buildPayload = () => ({
    title: form.title,
    description: form.description || null,
    status: form.status,
    priority: form.priority,
    assigned_to: form.assigned_to || null,
    due_date: form.due_date || null,
    story_points: form.story_points ? Number(form.story_points) : null,
    sprint_id: form.sprint_id || null,
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isEditing && !effectiveProjectId) {
      addToast('Seleccioná un proyecto', 'error')
      return
    }
    try {
      let taskId = task?.id

      if (isEditing) {
        await updateTask.mutateAsync({ id: task.id, ...buildPayload() })
      } else {
        const created = await createTask.mutateAsync({
          ...buildPayload(),
          project_id: effectiveProjectId,
          position: 0,
        })
        taskId = created.id
      }

      await setTaskTags.mutateAsync({ taskId, tagIds: Array.from(selectedTags) })

      addToast(isEditing ? 'Tarea actualizada' : 'Tarea creada')
      onClose()
    } catch {
      addToast('No se pudo guardar la tarea', 'error')
    }
  }

  const handleDelete = async () => {
    if (!task) return
    try {
      await deleteTask.mutateAsync(task.id)
      addToast('Tarea eliminada')
      onClose()
    } catch {
      addToast('No se pudo eliminar la tarea', 'error')
    }
  }

  const isPending = createTask.isPending || updateTask.isPending || setTaskTags.isPending

  return (
    <Modal title={isEditing ? 'Editar tarea' : 'Nueva tarea'} onClose={onClose} size="lg">
      <form className={styles.form} onSubmit={handleSubmit}>
        {!isEditing && !projectId && (
          <div className={styles.field}>
            <label className={styles.label}>Proyecto</label>
            <Select
              value={form.project_id}
              onChange={handleSelectChange('project_id')}
              placeholder="Seleccionar proyecto"
            >
              {projects?.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </Select>
          </div>
        )}

        <div className={styles.field}>
          <label className={styles.label}>Título</label>
          <input value={form.title} onChange={handleChange('title')} required autoFocus />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Descripción</label>
          <textarea
            className={styles.textarea}
            value={form.description}
            onChange={handleChange('description')}
          />
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>Estado</label>
            <Select value={form.status} onChange={handleSelectChange('status')}>
              {COLUMNS.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.label}
                </option>
              ))}
            </Select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Prioridad</label>
            <Select value={form.priority} onChange={handleSelectChange('priority')}>
              {PRIORITY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>Asignado a</label>
            <Select value={form.assigned_to} onChange={handleSelectChange('assigned_to')} placeholder="Sin asignar">
              <option value="">Sin asignar</option>
              {users?.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.full_name}
                </option>
              ))}
            </Select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Fecha límite</label>
            <input type="date" value={form.due_date} onChange={handleChange('due_date')} />
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>Story points</label>
            <input
              type="number"
              min="0"
              value={form.story_points}
              onChange={handleChange('story_points')}
            />
          </div>
          {sprints?.length > 0 && (
            <div className={styles.field}>
              <label className={styles.label}>Sprint</label>
              <Select value={form.sprint_id} onChange={handleSelectChange('sprint_id')} placeholder="Sin sprint">
                <option value="">Sin sprint</option>
                {sprints.map((sprint) => (
                  <option key={sprint.id} value={sprint.id}>
                    {sprint.name}
                  </option>
                ))}
              </Select>
            </div>
          )}
        </div>

        {tags?.length > 0 && (
          <div className={styles.field}>
            <label className={styles.label}>Tags</label>
            <div className={styles.tagList}>
              {tags.map((tag) => {
                const active = selectedTags.has(tag.id)
                return (
                  <button
                    type="button"
                    key={tag.id}
                    className={[styles.tagOption, active ? styles.tagOptionActive : ''].join(' ')}
                    style={
                      active ? { background: `${tag.color}26`, color: tag.color } : undefined
                    }
                    onClick={() => toggleTag(tag.id)}
                  >
                    {tag.name}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {isEditing && <TaskChecklist taskId={task.id} />}

        <div className={styles.actions}>
          <div>
            {isEditing && (
              <Button type="button" variant="danger" size="sm" onClick={handleDelete}>
                Eliminar
              </Button>
            )}
          </div>
          <div className={styles.actionsRight}>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Guardando...' : 'Guardar'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  )
}
