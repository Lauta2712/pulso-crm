import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Select from '../ui/Select'
import { useCreateCampaign, useUpdateCampaign } from '../../hooks/useCampaigns'
import { useClients } from '../../hooks/useClients'
import { useUIStore } from '../../store/useUIStore'
import styles from '../docs/DocFormModal.module.css'

const PLATFORMS = [
  { value: 'meta', label: 'Meta Ads' },
  { value: 'google', label: 'Google Ads' },
  { value: 'tiktok', label: 'TikTok Ads' },
  { value: 'linkedin', label: 'LinkedIn Ads' },
  { value: 'other', label: 'Otra' },
]

const STATUSES = [
  { value: 'draft', label: 'Borrador' },
  { value: 'active', label: 'Activa' },
  { value: 'paused', label: 'Pausada' },
  { value: 'completed', label: 'Completada' },
  { value: 'cancelled', label: 'Cancelada' },
]

export default function CampaignFormModal({ campaign, onClose }) {
  const isEditing = !!campaign
  const addToast = useUIStore((state) => state.addToast)
  const createCampaign = useCreateCampaign()
  const updateCampaign = useUpdateCampaign()
  const { data: clients } = useClients()

  const [form, setForm] = useState({
    name: campaign?.name ?? '',
    platform: campaign?.platform ?? 'meta',
    status: campaign?.status ?? 'draft',
    client_id: campaign?.client_id ?? '',
    budget: campaign?.budget ?? '',
    spent: campaign?.spent ?? '',
    start_date: campaign?.start_date ?? '',
    end_date: campaign?.end_date ?? '',
    objective: campaign?.objective ?? '',
    notes: campaign?.notes ?? '',
    url: campaign?.url ?? '',
  })

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  const handleSelectChange = (field) => (value) => setForm((f) => ({ ...f, [field]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      name: form.name,
      platform: form.platform,
      status: form.status,
      client_id: form.client_id || null,
      budget: form.budget ? Number(form.budget) : null,
      spent: form.spent ? Number(form.spent) : 0,
      start_date: form.start_date || null,
      end_date: form.end_date || null,
      objective: form.objective || null,
      notes: form.notes || null,
      url: form.url || null,
    }

    try {
      if (isEditing) {
        await updateCampaign.mutateAsync({ id: campaign.id, ...payload })
        addToast('Campaña actualizada')
      } else {
        await createCampaign.mutateAsync(payload)
        addToast('Campaña creada')
      }
      onClose()
    } catch (err) {
      console.error(err)
      addToast(err?.message || 'No se pudo guardar la campaña', 'error')
    }
  }

  const isPending = createCampaign.isPending || updateCampaign.isPending

  return (
    <Modal title={isEditing ? 'Editar campaña' : 'Nueva campaña'} onClose={onClose} size="lg">
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label}>Nombre</label>
          <input value={form.name} onChange={handleChange('name')} required autoFocus />
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>Plataforma</label>
            <Select value={form.platform} onChange={handleSelectChange('platform')}>
              {PLATFORMS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </Select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Estado</label>
            <Select value={form.status} onChange={handleSelectChange('status')}>
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>{s.label}</option>
              ))}
            </Select>
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>Cliente</label>
            <Select value={form.client_id} onChange={handleSelectChange('client_id')} placeholder="Sin cliente">
              <option value="">Sin cliente</option>
              {clients?.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Objetivo</label>
            <input value={form.objective} onChange={handleChange('objective')} placeholder="Conversiones, tráfico, alcance..." />
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>Presupuesto</label>
            <input type="number" min="0" value={form.budget} onChange={handleChange('budget')} placeholder="0" />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Gastado</label>
            <input type="number" min="0" value={form.spent} onChange={handleChange('spent')} placeholder="0" />
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>Inicio</label>
            <input type="date" value={form.start_date} onChange={handleChange('start_date')} />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Fin</label>
            <input type="date" value={form.end_date} onChange={handleChange('end_date')} />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>URL de la campaña</label>
          <input type="url" value={form.url} onChange={handleChange('url')} placeholder="https://business.facebook.com/..." />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Notas</label>
          <textarea className={styles.textarea} value={form.notes} onChange={handleChange('notes')} />
        </div>

        <div className={styles.actions}>
          <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
