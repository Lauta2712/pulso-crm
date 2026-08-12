import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Select from '../ui/Select'
import { useCreateDocument, useUpdateDocument } from '../../hooks/useDocuments'
import { useUIStore } from '../../store/useUIStore'
import styles from './DocFormModal.module.css'

export const DOC_CATEGORIES = ['Contrato', 'Propuesta', 'Branding', 'Legal', 'Manual', 'Otro']

export default function DocFormModal({ document, onClose }) {
  const isEditing = !!document
  const addToast = useUIStore((state) => state.addToast)
  const createDocument = useCreateDocument()
  const updateDocument = useUpdateDocument()

  const [form, setForm] = useState({
    title: document?.title ?? '',
    category: document?.category ?? DOC_CATEGORIES[0],
    url: document?.url ?? '',
    notes: document?.notes ?? '',
  })

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  const handleSelectChange = (field) => (value) => setForm((f) => ({ ...f, [field]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (isEditing) {
        await updateDocument.mutateAsync({ id: document.id, ...form })
        addToast('Documento actualizado')
      } else {
        await createDocument.mutateAsync(form)
        addToast('Documento creado')
      }
      onClose()
    } catch (err) {
      console.error(err)
      addToast(err?.message || 'No se pudo guardar el documento', 'error')
    }
  }

  const isPending = createDocument.isPending || updateDocument.isPending

  return (
    <Modal title={isEditing ? 'Editar documento' : 'Nuevo documento'} onClose={onClose}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>Título</label>
            <input value={form.title} onChange={handleChange('title')} required autoFocus />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Categoría</label>
            <Select value={form.category} onChange={handleSelectChange('category')}>
              {DOC_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Link</label>
          <input
            type="url"
            value={form.url}
            onChange={handleChange('url')}
            placeholder="https://drive.google.com/..."
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
