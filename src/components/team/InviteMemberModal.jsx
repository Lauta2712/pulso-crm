import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Select from '../ui/Select'
import { useCreateTeamMember } from '../../hooks/useTeam'
import { useUIStore } from '../../store/useUIStore'
import styles from './InviteMemberModal.module.css'

const ROLE_OPTIONS = [
  { value: 'developer', label: 'Developer' },
  { value: 'designer', label: 'Designer' },
  { value: 'pm', label: 'PM' },
  { value: 'viewer', label: 'Viewer' },
  { value: 'owner', label: 'Owner' },
]

export default function InviteMemberModal({ onClose }) {
  const addToast = useUIStore((state) => state.addToast)
  const createTeamMember = useCreateTeamMember()

  const [form, setForm] = useState({ email: '', full_name: '', role: 'developer' })

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  const handleSelectChange = (field) => (value) => setForm((f) => ({ ...f, [field]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await createTeamMember.mutateAsync(form)
      addToast('Invitación enviada correctamente')
      onClose()
    } catch (err) {
      addToast(err.message || 'No se pudo invitar al integrante', 'error')
    }
  }

  return (
    <Modal title="Nuevo integrante" onClose={onClose}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label}>Nombre</label>
          <input value={form.full_name} onChange={handleChange('full_name')} required autoFocus />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Email</label>
          <input type="email" value={form.email} onChange={handleChange('email')} required />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Rol</label>
          <Select value={form.role} onChange={handleSelectChange('role')}>
            {ROLE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>

        <p className={styles.hint}>
          Se le enviará un email de invitación para que configure su contraseña.
        </p>

        <div className={styles.actions}>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={createTeamMember.isPending}>
            {createTeamMember.isPending ? 'Invitando...' : 'Invitar'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
