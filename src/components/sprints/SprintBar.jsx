import { useState } from 'react'
import { useActiveSprint, useSprintTasks, useUpdateSprint } from '../../hooks/useSprints'
import Button from '../ui/Button'
import SprintFormModal from './SprintFormModal'
import { useUIStore } from '../../store/useUIStore'
import { formatDate } from '../../lib/format'
import styles from './SprintBar.module.css'

export default function SprintBar({ projectId }) {
  const [showForm, setShowForm] = useState(false)
  const addToast = useUIStore((state) => state.addToast)

  const { data: activeSprint } = useActiveSprint(projectId)
  const { data: sprintTasks } = useSprintTasks(activeSprint?.id)
  const updateSprint = useUpdateSprint()

  const handleCompleteSprint = async () => {
    try {
      await updateSprint.mutateAsync({ id: activeSprint.id, is_active: false })
      addToast('Sprint completado')
    } catch (err) {
      console.error(err)
      addToast(err?.message || 'No se pudo completar el sprint', 'error')
    }
  }

  const totalPoints = sprintTasks?.reduce((sum, t) => sum + (t.story_points ?? 0), 0) ?? 0
  const donePoints =
    sprintTasks
      ?.filter((t) => t.status === 'done')
      .reduce((sum, t) => sum + (t.story_points ?? 0), 0) ?? 0
  const progress = totalPoints > 0 ? Math.round((donePoints / totalPoints) * 100) : 0

  const totalTasks = sprintTasks?.length ?? 0
  const doneTasks = sprintTasks?.filter((t) => t.status === 'done').length ?? 0

  return (
    <div className={styles.bar}>
      {activeSprint ? (
        <>
          <div className={styles.info}>
            <div className={styles.name}>{activeSprint.name}</div>
            {activeSprint.goal && <div className={styles.goal}>{activeSprint.goal}</div>}
            <div className={styles.dates}>
              {formatDate(activeSprint.start_date)} – {formatDate(activeSprint.end_date)}
            </div>
          </div>

          <div className={styles.progress}>
            <div className={styles.progressLabel}>
              <span>
                {doneTasks}/{totalTasks} tareas · {donePoints}/{totalPoints} pts
              </span>
              <span>{progress}%</span>
            </div>
            <div className={styles.track}>
              <div className={styles.fill} style={{ width: `${progress}%` }} />
            </div>
          </div>

          <Button variant="secondary" size="sm" onClick={handleCompleteSprint}>
            Completar sprint
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowForm(true)}>
            Nuevo sprint
          </Button>
        </>
      ) : (
        <div className={styles.empty}>
          <span>Sin sprint activo</span>
          <Button variant="secondary" size="sm" onClick={() => setShowForm(true)}>
            Nuevo sprint
          </Button>
        </div>
      )}

      {showForm && (
        <SprintFormModal
          projectId={projectId}
          activeSprint={activeSprint}
          onClose={() => setShowForm(false)}
        />
      )}
    </div>
  )
}
