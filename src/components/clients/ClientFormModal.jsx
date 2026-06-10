import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { useCreateClient } from '../../hooks/useClients'
import { useUIStore } from '../../store/useUIStore'
import styles from './ClientFormModal.module.css'

const STATUS_OPTIONS = [
  { value: 'prospect', label: 'Prospecto' },
  { value: 'active', label: 'Activo' },
  { value: 'inactive', label: 'Inactivo' },
  { value: 'churned', label: 'Perdido' },
]

export default function ClientFormModal({ onClose }) {
  const addToast = useUIStore((state) => state.addToast)
  const createClient = useCreateClient()

  const [form, setForm] = useState({
    name: '',
    company: '',
    status: 'prospect',
    email: '',
    phone: '',
    instagram: '',
    source: '',
    first_contact: new Date().toISOString().slice(0, 10),
  })

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      await createClient.mutateAsync(form)
      addToast('Cliente creado correctamente')
      onClose()
    } catch {
      addToast('No se pudo crear el cliente', 'error')
    }
  }

  return (
    <Modal title="Nuevo cliente" onClose={onClose}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label}>Nombre</label>
          <input value={form.name} onChange={handleChange('name')} required autoFocus />
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>Empresa</label>
            <input value={form.company} onChange={handleChange('company')} />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Estado</label>
            <select value={form.status} onChange={handleChange('status')}>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>Email</label>
            <input type="email" value={form.email} onChange={handleChange('email')} />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Teléfono</label>
            <input value={form.phone} onChange={handleChange('phone')} />
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>Instagram</label>
            <input value={form.instagram} onChange={handleChange('instagram')} />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Origen</label>
            <input
              value={form.source}
              onChange={handleChange('source')}
              placeholder="Referido, redes, etc."
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Primer contacto</label>
          <input
            type="date"
            value={form.first_contact}
            onChange={handleChange('first_contact')}
          />
        </div>

        <div className={styles.actions}>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={createClient.isPending}>
            {createClient.isPending ? 'Creando...' : 'Crear cliente'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
