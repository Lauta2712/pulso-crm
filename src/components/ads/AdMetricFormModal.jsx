import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import { useAddCampaignMetric, useUpdateCampaignMetric } from '../../hooks/useCampaignMetrics'
import { useUIStore } from '../../store/useUIStore'
import styles from '../docs/DocFormModal.module.css'

export default function AdMetricFormModal({ campaignId, metric, onClose }) {
  const isEditing = !!metric
  const addToast = useUIStore((state) => state.addToast)
  const addMetric = useAddCampaignMetric()
  const updateMetric = useUpdateCampaignMetric()

  const [form, setForm] = useState({
    date: metric?.date ?? new Date().toISOString().slice(0, 10),
    impressions: metric?.impressions ?? '',
    reach: metric?.reach ?? '',
    clicks: metric?.clicks ?? '',
    conversions: metric?.conversions ?? '',
    spend: metric?.spend ?? '',
  })

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      date: form.date,
      impressions: Number(form.impressions) || 0,
      reach: Number(form.reach) || 0,
      clicks: Number(form.clicks) || 0,
      conversions: Number(form.conversions) || 0,
      spend: Number(form.spend) || 0,
    }

    try {
      if (isEditing) {
        await updateMetric.mutateAsync({ id: metric.id, campaign_id: campaignId, ...payload })
        addToast('Métricas actualizadas')
      } else {
        await addMetric.mutateAsync({ campaign_id: campaignId, ...payload })
        addToast('Métricas cargadas')
      }
      onClose()
    } catch (err) {
      const duplicate = err?.code === '23505'
      addToast(duplicate ? 'Ya hay métricas cargadas para esa fecha' : 'No se pudo guardar', 'error')
    }
  }

  const isPending = addMetric.isPending || updateMetric.isPending

  return (
    <Modal title={isEditing ? 'Editar métricas' : 'Cargar métricas'} onClose={onClose}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label}>Fecha</label>
          <input type="date" value={form.date} onChange={handleChange('date')} required autoFocus />
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>Impresiones</label>
            <input type="number" min="0" value={form.impressions} onChange={handleChange('impressions')} placeholder="0" />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Alcance</label>
            <input type="number" min="0" value={form.reach} onChange={handleChange('reach')} placeholder="0" />
          </div>
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>Clicks</label>
            <input type="number" min="0" value={form.clicks} onChange={handleChange('clicks')} placeholder="0" />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Conversiones</label>
            <input type="number" min="0" value={form.conversions} onChange={handleChange('conversions')} placeholder="0" />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Gasto</label>
          <input type="number" min="0" step="0.01" value={form.spend} onChange={handleChange('spend')} placeholder="0" />
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
