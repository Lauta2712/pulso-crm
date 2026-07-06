import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useCampaigns, useDeleteCampaign } from '../../hooks/useCampaigns'
import { useClients } from '../../hooks/useClients'
import CampaignFormModal from '../../components/campaigns/CampaignFormModal'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Select from '../../components/ui/Select'
import EmptyState from '../../components/ui/EmptyState'
import { formatCurrency } from '../../lib/format'
import { CAMPAIGN_STATUS_CONFIG, CAMPAIGN_PLATFORM_LABEL } from '../../lib/campaignMeta'
import { useUIStore } from '../../store/useUIStore'
import styles from '../Content/Content.module.css'

export default function CampaignList() {
  const [clientId, setClientId] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)

  const filters = useMemo(() => {
    const f = {}
    if (clientId) f.clientId = clientId
    if (statusFilter) f.status = statusFilter
    return f
  }, [clientId, statusFilter])

  const { data: campaigns, isLoading, isError } = useCampaigns(filters)
  const { data: clients } = useClients()
  const deleteCampaign = useDeleteCampaign()
  const addToast = useUIStore((state) => state.addToast)

  const handleDelete = async (campaign) => {
    if (!window.confirm(`¿Eliminar la campaña "${campaign.name}"?`)) return
    try {
      await deleteCampaign.mutateAsync(campaign.id)
      addToast('Campaña eliminada')
    } catch {
      addToast('No se pudo eliminar', 'error')
    }
  }

  const activeCampaigns = campaigns?.filter((c) => c.status === 'active') ?? []
  const totalBudget = activeCampaigns.reduce((s, c) => s + Number(c.budget || 0), 0)
  const totalSpent = activeCampaigns.reduce((s, c) => s + Number(c.spent || 0), 0)

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Campañas</h1>
        <Button onClick={() => setShowModal(true)}>+ Nueva campaña</Button>
      </div>

      <div className={styles.toolbar}>
        <div className={styles.filters}>
          <Select value={clientId} onChange={setClientId} className={styles.filterSelect}>
            <option value="">Todos los clientes</option>
            {clients?.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
          <Select value={statusFilter} onChange={setStatusFilter} className={styles.filterSelect}>
            <option value="">Todos los estados</option>
            {Object.entries(CAMPAIGN_STATUS_CONFIG).map(([k, config]) => (
              <option key={k} value={k}>{config.label}</option>
            ))}
          </Select>
        </div>
        {activeCampaigns.length > 0 && (
          <div className={styles.budgetBar}>
            <span className={styles.budgetLabel}>
              Activas: {formatCurrency(totalSpent)} / {formatCurrency(totalBudget)}
            </span>
            <div className={styles.budgetTrack}>
              <div
                className={styles.budgetFill}
                style={{
                  width: totalBudget > 0 ? `${Math.min((totalSpent / totalBudget) * 100, 100)}%` : '0%',
                  background: totalBudget > 0 && totalSpent / totalBudget > 0.9 ? 'var(--danger)' : 'var(--accent)',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {isLoading && <p style={{ color: 'var(--text-secondary)' }}>Cargando...</p>}

      {!isLoading && (isError || campaigns?.length === 0) && (
        <EmptyState
          icon="📢"
          title="No hay campañas"
          description="Gestioná las campañas publicitarias de tus clientes."
          action={<Button onClick={() => setShowModal(true)}>+ Nueva campaña</Button>}
        />
      )}

      {!isLoading && !isError && campaigns?.length > 0 && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Plataforma</th>
                <th>Cliente</th>
                <th>Estado</th>
                <th>Presupuesto</th>
                <th>Gastado</th>
                <th>Período</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map((campaign) => {
                const pct = campaign.budget > 0 ? (Number(campaign.spent || 0) / Number(campaign.budget)) * 100 : 0
                return (
                  <tr key={campaign.id}>
                    <td className={styles.name}>
                      {campaign.name}
                      {campaign.objective && (
                        <div className={styles.muted} style={{ fontSize: 11 }}>{campaign.objective}</div>
                      )}
                    </td>
                    <td><Badge variant="info">{CAMPAIGN_PLATFORM_LABEL[campaign.platform]}</Badge></td>
                    <td className={styles.muted}>{campaign.clients?.name ?? '—'}</td>
                    <td>
                      <Badge variant={CAMPAIGN_STATUS_CONFIG[campaign.status]?.variant}>
                        {CAMPAIGN_STATUS_CONFIG[campaign.status]?.label}
                      </Badge>
                    </td>
                    <td className={styles.muted}>{campaign.budget ? formatCurrency(campaign.budget) : '—'}</td>
                    <td>
                      {campaign.budget ? (
                        <div className={styles.budgetBar}>
                          <span className={styles.budgetLabel}>{formatCurrency(campaign.spent || 0)}</span>
                          <div className={styles.budgetTrack}>
                            <div
                              className={styles.budgetFill}
                              style={{
                                width: `${Math.min(pct, 100)}%`,
                                background: pct > 90 ? 'var(--danger)' : pct > 70 ? 'var(--warning)' : 'var(--success)',
                              }}
                            />
                          </div>
                        </div>
                      ) : '—'}
                    </td>
                    <td className={styles.muted}>
                      {campaign.start_date && campaign.end_date
                        ? `${new Date(campaign.start_date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })} → ${new Date(campaign.end_date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}`
                        : '—'}
                    </td>
                    <td className={styles.actions}>
                      <Link to={`/app/ads/${campaign.id}`}>
                        <Button variant="ghost" size="sm">Métricas</Button>
                      </Link>
                      {campaign.url && (
                        <a href={campaign.url} target="_blank" rel="noreferrer">
                          <Button variant="ghost" size="sm">Abrir</Button>
                        </a>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => setEditing(campaign)}>Editar</Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(campaign)}>Eliminar</Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && <CampaignFormModal onClose={() => setShowModal(false)} />}
      {editing && <CampaignFormModal campaign={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}
