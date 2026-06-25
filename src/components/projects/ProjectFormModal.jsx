import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Select from '../ui/Select'
import { useCreateProject } from '../../hooks/useProjects'
import { useClients } from '../../hooks/useClients'
import { useUsers } from '../../hooks/useUsers'
import { useUIStore } from '../../store/useUIStore'
import styles from './ProjectFormModal.module.css'

const STATUS_OPTIONS = [
  { value: 'planning', label: 'Planificación' },
  { value: 'active', label: 'Activo' },
  { value: 'paused', label: 'Pausado' },
  { value: 'completed', label: 'Completado' },
  { value: 'cancelled', label: 'Cancelado' },
]

const TYPE_OPTIONS = [
  { value: 'web', label: 'Web' },
  { value: 'system', label: 'Sistema' },
  { value: 'automation', label: 'Automatización' },
  { value: 'social', label: 'Social' },
  { value: 'consulting', label: 'Consultoría' },
  { value: 'saas', label: 'SaaS' },
  { value: 'other', label: 'Otro' },
]

export default function ProjectFormModal({ clientId, onClose, onCreated }) {
  const addToast = useUIStore((state) => state.addToast)
  const createProject = useCreateProject()
  const { data: clients } = useClients()
  const { data: users } = useUsers()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    name: '',
    description: '',
    client_id: clientId ?? '',
    status: 'planning',
    type: 'web',
    budget: '',
    currency: 'ARS',
    start_date: '',
    end_date: '',
    repo_url: '',
    deploy_url: '',
    assigned_to: '',
  })

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  const handleSelectChange = (field) => (value) => setForm((f) => ({ ...f, [field]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const payload = {
        ...form,
        client_id: form.client_id || null,
        budget: form.budget ? Number(form.budget) : null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
      }
      if (!form.assigned_to) delete payload.assigned_to
      const project = await createProject.mutateAsync(payload)
      addToast('Proyecto creado correctamente')
      onClose()
      if (onCreated) onCreated(project)
      else navigate(`/app/projects/${project.id}`)
    } catch {
      addToast('No se pudo crear el proyecto', 'error')
    }
  }

  return (
    <Modal title="Nuevo proyecto" onClose={onClose}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label}>Nombre</label>
          <input value={form.name} onChange={handleChange('name')} required autoFocus />
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
            <label className={styles.label}>Cliente</label>
            <Select value={form.client_id} onChange={handleSelectChange('client_id')}>
              <option value="">Sin cliente</option>
              {clients?.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </Select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Tipo</label>
            <Select value={form.type} onChange={handleSelectChange('type')}>
              {TYPE_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>Estado</label>
            <Select value={form.status} onChange={handleSelectChange('status')}>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Presupuesto (ARS)</label>
            <input type="number" min="0" value={form.budget} onChange={handleChange('budget')} />
          </div>
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

        <div className={styles.field}>
          <label className={styles.label}>Responsable</label>
          <Select value={form.assigned_to} onChange={handleSelectChange('assigned_to')}>
            <option value="">Sin asignar</option>
            {users?.map((u) => (
              <option key={u.id} value={u.id}>{u.full_name}</option>
            ))}
          </Select>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>Repositorio</label>
            <input value={form.repo_url} onChange={handleChange('repo_url')} placeholder="https://github.com/..." />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Deploy</label>
            <input value={form.deploy_url} onChange={handleChange('deploy_url')} placeholder="https://..." />
          </div>
        </div>

        <div className={styles.actions}>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={createProject.isPending}>
            {createProject.isPending ? 'Creando...' : 'Crear proyecto'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
