import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { useCreateSprint, useUpdateSprint } from '../../hooks/useSprints'
import { useUIStore } from '../../store/useUIStore'
import styles from './SprintFormModal.module.css'

export default function SprintFormModal({ projectId, activeSprint, onClose }) {
  const addToast = useUIStore((state) => state.addToast)
  const createSprint = useCreateSprint()
  const updateSprint = useUpdateSprint()

  const [form, setForm] = useState({
    name: '',
    goal: '',
    start_date: new Date().toISOString().slice(0, 10),
    end_date: '',
  })

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (activeSprint) {
        await updateSprint.mutateAsync({ id: activeSprint.id, is_active: false })
      }
      await createSprint.mutateAsync({
        ...form,
        goal: form.goal || null,
        end_date: form.end_date || null,
        project_id: projectId,
        is_active: true,
      })
      addToast('Sprint creado')
      onClose()
    } catch {
      addToast('No se pudo crear el sprint', 'error')
    }
  }

  const isPending = createSprint.isPending || updateSprint.isPending

  return (
    <Modal title="Nuevo sprint" onClose={onClose}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label}>Nombre</label>
          <input value={form.name} onChange={handleChange('name')} required autoFocus />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Objetivo</label>
          <textarea className={styles.textarea} value={form.goal} onChange={handleChange('goal')} />
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>Fecha de inicio</label>
            <input type="date" value={form.start_date} onChange={handleChange('start_date')} />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Fecha de fin</label>
            <input type="date" value={form.end_date} onChange={handleChange('end_date')} />
          </div>
        </div>

        <div className={styles.actions}>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Creando...' : 'Crear sprint'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
