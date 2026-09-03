import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Select from '../ui/Select'
import { useUpdateUser, useUpdateUserRole } from '../../hooks/useUsers'
import { useUIStore } from '../../store/useUIStore'
import styles from './EditMemberModal.module.css'

const ROLE_OPTIONS = [
  { value: 'owner', label: 'Owner' },
  { value: 'developer', label: 'Developer' },
  { value: 'designer', label: 'Designer' },
  { value: 'pm', label: 'PM' },
  { value: 'viewer', label: 'Viewer' },
]

export default function EditMemberModal({ member, onClose }) {
  const addToast = useUIStore((state) => state.addToast)
  const updateUser = useUpdateUser()
  const updateUserRole = useUpdateUserRole()

  const [form, setForm] = useState({ full_name: member.full_name ?? '', role: member.role })

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  const handleSelectChange = (field) => (value) => setForm((f) => ({ ...f, [field]: value }))

  const isPending = updateUser.isPending || updateUserRole.isPending

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (form.full_name !== member.full_name) {
        await updateUser.mutateAsync({ id: member.id, full_name: form.full_name })
      }
      if (form.role !== member.role) {
        await updateUserRole.mutateAsync({ orgMemberId: member.org_member_id, role: form.role })
      }
      addToast('Integrante actualizado')
      onClose()
    } catch (err) {
      addToast(err.message || 'No se pudo actualizar el integrante', 'error')
    }
  }

  return (
    <Modal title="Editar integrante" onClose={onClose}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label}>Nombre</label>
          <input value={form.full_name} onChange={handleChange('full_name')} required autoFocus />
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

        <div className={styles.actions}>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
