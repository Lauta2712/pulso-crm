import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Select from '../ui/Select'
import { useCreateMediaAsset, useUpdateMediaAsset } from '../../hooks/useMedia'
import { useClients } from '../../hooks/useClients'
import { useProjects } from '../../hooks/useProjects'
import { useUIStore } from '../../store/useUIStore'
import styles from '../docs/DocFormModal.module.css'

const ASSET_TYPES = [
  { value: 'image', label: 'Imagen' },
  { value: 'video', label: 'Video' },
  { value: 'document', label: 'Documento' },
  { value: 'design', label: 'Diseño' },
  { value: 'other', label: 'Otro' },
]

export default function MediaFormModal({ asset, onClose }) {
  const isEditing = !!asset
  const addToast = useUIStore((state) => state.addToast)
  const createAsset = useCreateMediaAsset()
  const updateAsset = useUpdateMediaAsset()
  const { data: clients } = useClients()
  const { data: projects } = useProjects()

  const [form, setForm] = useState({
    name: asset?.name ?? '',
    type: asset?.type ?? 'image',
    url: asset?.url ?? '',
    client_id: asset?.client_id ?? '',
    project_id: asset?.project_id ?? '',
    notes: asset?.notes ?? '',
  })

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  const handleSelectChange = (field) => (value) => setForm((f) => ({ ...f, [field]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      name: form.name,
      type: form.type,
      url: form.url,
      client_id: form.client_id || null,
      project_id: form.project_id || null,
      notes: form.notes || null,
    }

    try {
      if (isEditing) {
        await updateAsset.mutateAsync({ id: asset.id, ...payload })
        addToast('Asset actualizado')
      } else {
        await createAsset.mutateAsync(payload)
        addToast('Asset creado')
      }
      onClose()
    } catch (err) {
      console.error(err)
      addToast(err?.message || 'No se pudo guardar el asset', 'error')
    }
  }

  const isPending = createAsset.isPending || updateAsset.isPending

  return (
    <Modal title={isEditing ? 'Editar asset' : 'Nuevo asset'} onClose={onClose}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label}>Nombre</label>
          <input value={form.name} onChange={handleChange('name')} required autoFocus />
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>Tipo</label>
            <Select value={form.type} onChange={handleSelectChange('type')}>
              {ASSET_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </Select>
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Cliente</label>
            <Select value={form.client_id} onChange={handleSelectChange('client_id')} placeholder="Sin cliente">
              <option value="">Sin cliente</option>
              {clients?.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Proyecto</label>
          <Select value={form.project_id} onChange={handleSelectChange('project_id')} placeholder="Sin proyecto">
            <option value="">Sin proyecto</option>
            {projects?.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </Select>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>URL del archivo</label>
          <input type="url" value={form.url} onChange={handleChange('url')} required placeholder="https://drive.google.com/... o https://figma.com/..." />
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
