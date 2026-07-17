import { useState } from 'react'
import { useDocuments, useDeleteDocument } from '../../hooks/useDocuments'
import DocFormModal from '../../components/docs/DocFormModal'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import { SkeletonTableRows } from '../../components/ui/Skeleton'
import { IconFileText } from '../../components/ui/icons'
import { useUIStore } from '../../store/useUIStore'
import styles from './Docs.module.css'

export default function DocList() {
  const { data: documents, isLoading, isError } = useDocuments()
  const deleteDocument = useDeleteDocument()
  const addToast = useUIStore((state) => state.addToast)

  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)

  const handleDelete = async (document) => {
    if (!window.confirm(`¿Eliminar el documento "${document.title}"?`)) return
    try {
      await deleteDocument.mutateAsync(document.id)
      addToast('Documento eliminado')
    } catch {
      addToast('No se pudo eliminar el documento', 'error')
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Docs</h1>
        <Button onClick={() => setShowModal(true)}>+ Nuevo documento</Button>
      </div>

      {isLoading && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Título</th>
                <th>Categoría</th>
                <th>Link</th>
                <th>Notas</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <SkeletonTableRows columns={5} />
            </tbody>
          </table>
        </div>
      )}
      {isError && <p style={{ color: 'var(--danger)' }}>Error al cargar los documentos.</p>}

      {!isLoading && !isError && documents?.length === 0 && (
        <EmptyState
          icon={<IconFileText />}
          title="No hay documentos registrados"
          description="Cargá los documentos importantes de Pulso Studio."
          action={<Button onClick={() => setShowModal(true)}>+ Nuevo documento</Button>}
        />
      )}

      {!isLoading && !isError && documents?.length > 0 && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Título</th>
                <th>Categoría</th>
                <th>Link</th>
                <th>Notas</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {documents.map((document) => (
                <tr key={document.id}>
                  <td className={styles.name}>{document.title}</td>
                  <td>
                    <Badge variant="info">{document.category || 'Otro'}</Badge>
                  </td>
                  <td className={styles.muted}>
                    {document.url ? (
                      <a href={document.url} target="_blank" rel="noreferrer">
                        Abrir
                      </a>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className={styles.notes}>{document.notes || '—'}</td>
                  <td className={styles.actions}>
                    <Button variant="ghost" size="sm" onClick={() => setEditing(document)}>
                      Editar
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(document)}>
                      Eliminar
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && <DocFormModal onClose={() => setShowModal(false)} />}
      {editing && <DocFormModal document={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}
