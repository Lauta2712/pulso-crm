import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Select from '../ui/Select'
import { useCreateCandidate, useUpdateCandidate } from '../../hooks/useCandidates'
import { useUIStore } from '../../store/useUIStore'
import styles from '../docs/DocFormModal.module.css'

const STATUS_OPTIONS = [
  { value: 'new', label: 'Nuevo' },
  { value: 'contacted', label: 'Contactado' },
  { value: 'interviewing', label: 'Entrevista' },
  { value: 'hired', label: 'Contratado' },
  { value: 'rejected', label: 'Rechazado' },
]

export default function CandidateFormModal({ candidate, onClose }) {
  const isEditing = !!candidate
  const addToast = useUIStore((state) => state.addToast)
  const createCandidate = useCreateCandidate()
  const updateCandidate = useUpdateCandidate()

  const [form, setForm] = useState({
    full_name: candidate?.full_name ?? '',
    email: candidate?.email ?? '',
    phone: candidate?.phone ?? '',
    position: candidate?.position ?? '',
    status: candidate?.status ?? 'new',
    source: candidate?.source ?? '',
    notes: candidate?.notes ?? '',
  })
  const [cvFile, setCvFile] = useState(null)

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  const handleSelectChange = (field) => (value) => setForm((f) => ({ ...f, [field]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (isEditing) {
        await updateCandidate.mutateAsync({ id: candidate.id, ...form, cvFile })
        addToast('Postulante actualizado')
      } else {
        await createCandidate.mutateAsync({ ...form, cvFile })
        addToast('Postulante cargado')
      }
      onClose()
    } catch (err) {
      console.error(err)
      addToast('No se pudo guardar el postulante', 'error')
    }
  }

  const isPending = createCandidate.isPending || updateCandidate.isPending

  return (
    <Modal title={isEditing ? 'Editar postulante' : 'Nuevo postulante'} onClose={onClose}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>Nombre completo</label>
            <input value={form.full_name} onChange={handleChange('full_name')} required autoFocus />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Puesto</label>
            <input
              value={form.position}
              onChange={handleChange('position')}
              placeholder="Frontend, diseño, etc."
            />
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
            <label className={styles.label}>Origen</label>
            <input
              value={form.source}
              onChange={handleChange('source')}
              placeholder="LinkedIn, referido, etc."
            />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>CV {isEditing && candidate.cv_filename ? `(actual: ${candidate.cv_filename})` : ''}</label>
          <input
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(e) => setCvFile(e.target.files?.[0] ?? null)}
          />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Notas</label>
          <textarea className={styles.textarea} value={form.notes} onChange={handleChange('notes')} />
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
