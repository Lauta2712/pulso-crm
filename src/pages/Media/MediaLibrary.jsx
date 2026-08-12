import { useMemo, useState } from 'react'
import { useMediaAssets, useDeleteMediaAsset } from '../../hooks/useMedia'
import { useClients } from '../../hooks/useClients'
import MediaFormModal from '../../components/media/MediaFormModal'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Select from '../../components/ui/Select'
import EmptyState from '../../components/ui/EmptyState'
import Skeleton, { SkeletonTableRows, SkeletonText } from '../../components/ui/Skeleton'
import { interactiveRowProps } from '../../lib/a11y'
import { IconImage, IconVideo, IconFileText, IconPalette, IconPaperclip, IconFolder } from '../../components/ui/icons'
import { useUIStore } from '../../store/useUIStore'
import styles from '../Content/Content.module.css'

const TYPE_LABEL = {
  image: 'Imagen',
  video: 'Video',
  document: 'Documento',
  design: 'Diseño',
  other: 'Otro',
}

const TYPE_ICON = {
  image: <IconImage />,
  video: <IconVideo />,
  document: <IconFileText />,
  design: <IconPalette />,
  other: <IconPaperclip />,
}

const TYPE_VARIANT = {
  image: 'info',
  video: 'warning',
  document: 'muted',
  design: 'accent',
  other: 'muted',
}

export default function MediaLibrary() {
  const [clientId, setClientId] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const [view, setView] = useState('grid')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)

  const filters = useMemo(() => {
    const f = {}
    if (clientId) f.clientId = clientId
    if (typeFilter) f.type = typeFilter
    return f
  }, [clientId, typeFilter])

  const { data: assets, isLoading, isError } = useMediaAssets(filters)
  const { data: clients } = useClients()
  const deleteAsset = useDeleteMediaAsset()
  const addToast = useUIStore((state) => state.addToast)

  const handleDelete = async (asset) => {
    if (!window.confirm(`¿Eliminar "${asset.name}"?`)) return
    try {
      await deleteAsset.mutateAsync(asset.id)
      addToast('Asset eliminado')
    } catch (err) {
      console.error(err)
      addToast(err?.message || 'No se pudo eliminar', 'error')
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Media Library</h1>
        <Button onClick={() => setShowModal(true)}>+ Nuevo asset</Button>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.filters}>
          <Select value={clientId} onChange={setClientId} className={styles.filterSelect}>
            <option value="">Todos los clientes</option>
            {clients?.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
          <Select value={typeFilter} onChange={setTypeFilter} className={styles.filterSelect}>
            <option value="">Todos los tipos</option>
            {Object.entries(TYPE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </Select>
        </div>
        <div className={styles.viewToggle}>
          <button
            className={[styles.viewBtn, view === 'grid' ? styles.viewBtnActive : ''].join(' ')}
            onClick={() => setView('grid')}
          >
            Grilla
          </button>
          <button
            className={[styles.viewBtn, view === 'list' ? styles.viewBtnActive : ''].join(' ')}
            onClick={() => setView('list')}
          >
            Lista
          </button>
        </div>
      </div>

      {isLoading && view === 'grid' && (
        <div className={styles.mediaGrid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.mediaCard}>
              <Skeleton width="28px" height="28px" radius="6px" />
              <SkeletonText lines={2} />
            </div>
          ))}
        </div>
      )}

      {isLoading && view === 'list' && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Cliente</th>
                <th>Proyecto</th>
                <th>Notas</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <SkeletonTableRows columns={6} />
            </tbody>
          </table>
        </div>
      )}

      {!isLoading && (isError || assets?.length === 0) && (
        <EmptyState
          icon={<IconFolder />}
          title="No hay assets"
          description="Organizá los archivos de diseño, videos e imágenes por cliente y proyecto."
          action={<Button onClick={() => setShowModal(true)}>+ Nuevo asset</Button>}
        />
      )}

      {!isLoading && !isError && assets?.length > 0 && view === 'grid' && (
        <div className={styles.mediaGrid}>
          {assets.map((asset) => (
            <div
              key={asset.id}
              className={styles.mediaCard}
              onClick={() => setEditing(asset)}
              {...interactiveRowProps(() => setEditing(asset))}
            >
              <div className={styles.mediaIcon}>{TYPE_ICON[asset.type]}</div>
              <div className={styles.mediaName}>{asset.name}</div>
              <div className={styles.mediaMeta}>
                <Badge variant={TYPE_VARIANT[asset.type]}>{TYPE_LABEL[asset.type]}</Badge>
                {asset.clients?.name && <span> · {asset.clients.name}</span>}
              </div>
              {asset.projects?.name && (
                <div className={styles.mediaMeta}>{asset.projects.name}</div>
              )}
              <div className={styles.mediaActions} onClick={(e) => e.stopPropagation()}>
                <a href={asset.url} target="_blank" rel="noreferrer">
                  <Button variant="ghost" size="sm">Abrir</Button>
                </a>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(asset)}>Eliminar</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && !isError && assets?.length > 0 && view === 'list' && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Tipo</th>
                <th>Cliente</th>
                <th>Proyecto</th>
                <th>Notas</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset) => (
                <tr key={asset.id}>
                  <td className={[styles.name, styles.nameWithIcon].join(' ')}>
                    {TYPE_ICON[asset.type]} {asset.name}
                  </td>
                  <td><Badge variant={TYPE_VARIANT[asset.type]}>{TYPE_LABEL[asset.type]}</Badge></td>
                  <td className={styles.muted}>{asset.clients?.name ?? '—'}</td>
                  <td className={styles.muted}>{asset.projects?.name ?? '—'}</td>
                  <td className={styles.muted}>{asset.notes || '—'}</td>
                  <td className={styles.actions}>
                    <a href={asset.url} target="_blank" rel="noreferrer">
                      <Button variant="ghost" size="sm">Abrir</Button>
                    </a>
                    <Button variant="ghost" size="sm" onClick={() => setEditing(asset)}>Editar</Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(asset)}>Eliminar</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && <MediaFormModal onClose={() => setShowModal(false)} />}
      {editing && <MediaFormModal asset={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}
