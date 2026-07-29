import { useMemo, useState } from 'react'
import { useCandidates, useDeleteCandidate, getCandidateCvUrl } from '../../hooks/useCandidates'
import CandidateStatusBadge, { STATUS_CONFIG } from '../../components/candidates/CandidateStatusBadge'
import CandidateFormModal from '../../components/candidates/CandidateFormModal'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import { SkeletonTableRows, SkeletonCard } from '../../components/ui/Skeleton'
import { IconUsers } from '../../components/ui/icons'
import { formatDate } from '../../lib/format'
import { useUIStore } from '../../store/useUIStore'
import styles from './Candidates.module.css'

const TABS = [
  { value: 'all', label: 'Todos' },
  ...Object.entries(STATUS_CONFIG).map(([value, { label }]) => ({ value, label })),
]

export default function CandidateList() {
  const { data: candidates, isLoading, isError, refetch, isRefetching } = useCandidates()
  const deleteCandidate = useDeleteCandidate()
  const addToast = useUIStore((state) => state.addToast)

  const [tab, setTab] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)

  const filtered = useMemo(() => {
    if (!candidates) return []
    if (tab === 'all') return candidates
    return candidates.filter((c) => c.status === tab)
  }, [candidates, tab])

  const handleDelete = async (candidate) => {
    if (!window.confirm(`¿Eliminar a "${candidate.full_name}"?`)) return
    try {
      await deleteCandidate.mutateAsync(candidate)
      addToast('Postulante eliminado')
    } catch {
      addToast('No se pudo eliminar el postulante', 'error')
    }
  }

  const handleViewCv = async (candidate) => {
    try {
      const url = await getCandidateCvUrl(candidate.cv_path)
      window.open(url, '_blank', 'noreferrer')
    } catch {
      addToast('No se pudo abrir el CV', 'error')
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Postulantes</h1>
        <Button onClick={() => setShowModal(true)}>+ Nuevo postulante</Button>
      </div>

      {!isError && (
        <div className={styles.tabs}>
          {TABS.map((t) => (
            <button
              key={t.value}
              className={[styles.tab, tab === t.value ? styles.tabActive : ''].join(' ')}
              onClick={() => setTab(t.value)}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {isLoading && (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Puesto</th>
                  <th>Estado</th>
                  <th>Contacto</th>
                  <th>CV</th>
                  <th>Cargado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <SkeletonTableRows columns={7} />
              </tbody>
            </table>
          </div>
          <div className={styles.candidateCards}>
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} lines={4} className={styles.candidateCard} />
            ))}
          </div>
        </>
      )}

      {isError && (
        <EmptyState
          title="No se pudieron cargar los postulantes"
          description="Puede ser un problema de conexión o que la base todavía no esté lista. Probá de nuevo."
          action={
            <Button onClick={() => refetch()} disabled={isRefetching}>
              {isRefetching ? 'Reintentando...' : 'Reintentar'}
            </Button>
          }
        />
      )}

      {!isLoading && !isError && filtered.length === 0 && (
        <EmptyState
          icon={<IconUsers />}
          title={tab === 'all' ? 'No hay postulantes cargados' : 'No hay postulantes en este estado'}
          description="Sumá los CVs de las personas que se postulan a Pulso Studio."
          action={<Button onClick={() => setShowModal(true)}>+ Nuevo postulante</Button>}
        />
      )}

      {!isLoading && !isError && filtered.length > 0 && (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Puesto</th>
                  <th>Estado</th>
                  <th>Contacto</th>
                  <th>CV</th>
                  <th>Cargado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((candidate) => (
                  <tr key={candidate.id}>
                    <td className={styles.name}>{candidate.full_name}</td>
                    <td className={styles.muted}>{candidate.position || '—'}</td>
                    <td>
                      <CandidateStatusBadge status={candidate.status} />
                    </td>
                    <td className={styles.muted}>{candidate.email || candidate.phone || '—'}</td>
                    <td className={styles.muted}>
                      {candidate.cv_path ? (
                        <button
                          type="button"
                          className={styles.cvLink}
                          onClick={() => handleViewCv(candidate)}
                        >
                          Ver CV
                        </button>
                      ) : candidate.portfolio_url ? (
                        <a
                          href={candidate.portfolio_url}
                          target="_blank"
                          rel="noreferrer"
                          className={styles.cvLink}
                        >
                          Portfolio
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className={styles.muted}>{formatDate(candidate.created_at)}</td>
                    <td className={styles.actions}>
                      <Button variant="ghost" size="sm" onClick={() => setEditing(candidate)}>
                        Editar
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(candidate)}>
                        Eliminar
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={styles.candidateCards}>
            {filtered.map((candidate) => (
              <div key={candidate.id} className={['card', styles.candidateCard].join(' ')}>
                <div className={styles.candidateCardHeader}>
                  <span className={styles.name}>{candidate.full_name}</span>
                  <CandidateStatusBadge status={candidate.status} />
                </div>

                <div className={styles.candidateCardRow}>
                  <span className={styles.candidateCardLabel}>Puesto</span>
                  <span className={styles.muted}>{candidate.position || '—'}</span>
                </div>

                <div className={styles.candidateCardRow}>
                  <span className={styles.candidateCardLabel}>Contacto</span>
                  <span className={styles.muted}>{candidate.email || candidate.phone || '—'}</span>
                </div>

                <div className={styles.candidateCardRow}>
                  <span className={styles.candidateCardLabel}>CV</span>
                  {candidate.cv_path ? (
                    <button
                      type="button"
                      className={styles.cvLink}
                      onClick={() => handleViewCv(candidate)}
                    >
                      Ver CV
                    </button>
                  ) : candidate.portfolio_url ? (
                    <a
                      href={candidate.portfolio_url}
                      target="_blank"
                      rel="noreferrer"
                      className={styles.cvLink}
                    >
                      Portfolio
                    </a>
                  ) : (
                    <span className={styles.muted}>—</span>
                  )}
                </div>

                <div className={styles.candidateCardRow}>
                  <span className={styles.candidateCardLabel}>Cargado</span>
                  <span className={styles.muted}>{formatDate(candidate.created_at)}</span>
                </div>

                <div className={styles.candidateCardActions}>
                  <Button variant="ghost" size="sm" onClick={() => setEditing(candidate)}>
                    Editar
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(candidate)}>
                    Eliminar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {showModal && <CandidateFormModal onClose={() => setShowModal(false)} />}
      {editing && <CandidateFormModal candidate={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}
