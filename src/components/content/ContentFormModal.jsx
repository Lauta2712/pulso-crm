import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Select from '../ui/Select'
import { useCreateContentPost, useUpdateContentPost } from '../../hooks/useContent'
import { useClients } from '../../hooks/useClients'
import { useUIStore } from '../../store/useUIStore'
import styles from '../docs/DocFormModal.module.css'

const PLATFORMS = [
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'tiktok', label: 'TikTok' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'twitter', label: 'Twitter / X' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'other', label: 'Otra' },
]

const STATUSES = [
  { value: 'idea', label: 'Idea' },
  { value: 'draft', label: 'Borrador' },
  { value: 'review', label: 'En revisión' },
  { value: 'approved', label: 'Aprobado' },
  { value: 'published', label: 'Publicado' },
]

export default function ContentFormModal({ post, onClose }) {
  const isEditing = !!post
  const addToast = useUIStore((state) => state.addToast)
  const createPost = useCreateContentPost()
  const updatePost = useUpdateContentPost()
  const { data: clients } = useClients()

  const [form, setForm] = useState({
    title: post?.title ?? '',
    body: post?.body ?? '',
    platform: post?.platform ?? 'instagram',
    status: post?.status ?? 'idea',
    client_id: post?.client_id ?? '',
    scheduled_at: post?.scheduled_at ? post.scheduled_at.slice(0, 16) : '',
    post_url: post?.post_url ?? '',
    notes: post?.notes ?? '',
  })

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  const handleSelectChange = (field) => (value) => setForm((f) => ({ ...f, [field]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      title: form.title,
      body: form.body || null,
      platform: form.platform,
      status: form.status,
      client_id: form.client_id || null,
      scheduled_at: form.scheduled_at ? new Date(form.scheduled_at).toISOString() : null,
      post_url: form.post_url || null,
      notes: form.notes || null,
    }

    if (form.status === 'published' && !post?.published_at) {
      payload.published_at = new Date().toISOString()
    }

    try {
      if (isEditing) {
        await updatePost.mutateAsync({ id: post.id, ...payload })
        addToast('Publicación actualizada')
      } else {
        await createPost.mutateAsync(payload)
        addToast('Publicación creada')
      }
      onClose()
    } catch {
      addToast('No se pudo guardar la publicación', 'error')
    }
  }

  const isPending = createPost.isPending || updatePost.isPending

  return (
    <Modal title={isEditing ? 'Editar publicación' : 'Nueva publicación'} onClose={onClose} size="lg">
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.field}>
          <label className={styles.label}>Título</label>
          <input value={form.title} onChange={handleChange('title')} required autoFocus />
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
            <label className={styles.label}>Fecha programada</label>
            <input type="datetime-local" value={form.scheduled_at} onChange={handleChange('scheduled_at')} />
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Contenido</label>
          <textarea className={styles.textarea} value={form.body} onChange={handleChange('body')} placeholder="Texto del post, copy, guión..." />
        </div>

        <div className={styles.field}>
          <label className={styles.label}>URL del post</label>
          <input type="url" value={form.post_url} onChange={handleChange('post_url')} placeholder="https://instagram.com/p/..." />
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
