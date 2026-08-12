import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useCampaign } from '../../hooks/useCampaigns'
import { useCampaignMetrics, useDeleteCampaignMetric } from '../../hooks/useCampaignMetrics'
import AdMetricFormModal from '../../components/ads/AdMetricFormModal'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import Skeleton from '../../components/ui/Skeleton'
import BarChart from '../../components/dashboard/BarChart'
import { IconArrowLeft, IconChart } from '../../components/ui/icons'
import { CAMPAIGN_STATUS_CONFIG, CAMPAIGN_PLATFORM_LABEL } from '../../lib/campaignMeta'
import { formatCurrency, formatDate } from '../../lib/format'
import { useUIStore } from '../../store/useUIStore'
import styles from './Ads.module.css'

const EMPTY_TOTALS = { impressions: 0, reach: 0, clicks: 0, conversions: 0, spend: 0 }

function dateLabel(date) {
  return new Date(date).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}

export default function CampaignMetricsDetail() {
  const { id } = useParams()
  const { data: campaign, isLoading: loadingCampaign, isError } = useCampaign(id)
  const { data: metrics, isLoading: loadingMetrics } = useCampaignMetrics(id)
  const deleteMetric = useDeleteCampaignMetric()
  const addToast = useUIStore((state) => state.addToast)

  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)

  const isLoading = loadingCampaign || loadingMetrics

  const openNew = () => {
    setEditing(null)
    setShowModal(true)
  }

  const openEdit = (metric) => {
    setEditing(metric)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setEditing(null)
  }

  const handleDelete = async (metric) => {
    if (!window.confirm(`¿Eliminar el registro del ${formatDate(metric.date)}?`)) return
    try {
      await deleteMetric.mutateAsync({ id: metric.id, campaign_id: id })
      addToast('Registro eliminado')
    } catch (err) {
      console.error(err)
      addToast(err?.message || 'No se pudo eliminar', 'error')
    }
  }

  if (isLoading) {
    return (
      <div className="page">
        <Link to="/app/ads" className={styles.backLink}><IconArrowLeft /> Volver a publicidades</Link>

        <div className={styles.detailHeader}>
          <div>
            <Skeleton width="220px" height="24px" style={{ marginBottom: 'var(--space-sm)' }} />
            <Skeleton width="160px" height="14px" />
          </div>
        </div>

        <div className={styles.metrics} style={{ marginTop: 'var(--space-lg)' }}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={['card', styles.metricCard].join(' ')}>
              <Skeleton width="60%" height="12px" />
              <Skeleton width="40%" height="26px" />
            </div>
          ))}
        </div>

        <div className={styles.charts}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="card">
              <Skeleton width="50%" height="14px" style={{ marginBottom: 'var(--space-md)' }} />
              <Skeleton height="140px" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (isError || !campaign) {
    return (
      <div className="page">
        <p style={{ color: 'var(--danger)' }}>No se pudo cargar la campaña.</p>
      </div>
    )
  }

  const totals = (metrics ?? []).reduce(
    (acc, m) => ({
      impressions: acc.impressions + m.impressions,
      reach: acc.reach + m.reach,
      clicks: acc.clicks + m.clicks,
      conversions: acc.conversions + m.conversions,
      spend: acc.spend + Number(m.spend),
    }),
    { ...EMPTY_TOTALS }
  )
  const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0
  const costPerConversion = totals.conversions > 0 ? totals.spend / totals.conversions : null

  const reachChart = (metrics ?? []).map((m) => ({ label: dateLabel(m.date), value: m.reach }))
  const clicksChart = (metrics ?? []).map((m) => ({ label: dateLabel(m.date), value: m.clicks }))
  const conversionsChart = (metrics ?? []).map((m) => ({ label: dateLabel(m.date), value: m.conversions }))
  const spendChart = (metrics ?? []).map((m) => ({ label: dateLabel(m.date), value: Number(m.spend) }))

  const sortedMetrics = (metrics ?? []).slice().reverse()

  return (
    <div className="page">
      <Link to="/app/ads" className={styles.backLink}><IconArrowLeft /> Volver a publicidades</Link>

      <div className={styles.detailHeader}>
        <div>
          <h1 className="page-title">{campaign.name}</h1>
          <div className={styles.detailMeta}>
            <Badge variant="info">{CAMPAIGN_PLATFORM_LABEL[campaign.platform]}</Badge>
            <Badge variant={CAMPAIGN_STATUS_CONFIG[campaign.status]?.variant}>
              {CAMPAIGN_STATUS_CONFIG[campaign.status]?.label}
            </Badge>
            {campaign.clients?.name && <span className={styles.muted}>{campaign.clients.name}</span>}
          </div>
        </div>
        <Button onClick={openNew}>+ Cargar métricas</Button>
      </div>

      {!metrics || metrics.length === 0 ? (
        <div style={{ marginTop: 'var(--space-lg)' }}>
          <EmptyState
            icon={<IconChart />}
            title="Todavía no cargaste métricas"
            description="Registrá impresiones, alcance, clicks, conversiones y gasto para ver la evolución."
            action={<Button onClick={openNew}>+ Cargar métricas</Button>}
          />
        </div>
      ) : (
        <>
          <div className={styles.metrics} style={{ marginTop: 'var(--space-lg)' }}>
            <div className={['card', styles.metricCard].join(' ')}>
              <span className={styles.metricLabel}>Alcance total</span>
              <span className={styles.metricValue}>{totals.reach.toLocaleString('es-AR')}</span>
            </div>
            <div className={['card', styles.metricCard].join(' ')}>
              <span className={styles.metricLabel}>Clicks</span>
              <span className={styles.metricValue}>{totals.clicks.toLocaleString('es-AR')}</span>
              <span className={styles.muted} style={{ fontSize: 12 }}>{ctr.toFixed(2)}% CTR</span>
            </div>
            <div className={['card', styles.metricCard].join(' ')}>
              <span className={styles.metricLabel}>Conversiones</span>
              <span className={styles.metricValue}>{totals.conversions.toLocaleString('es-AR')}</span>
              <span className={styles.muted} style={{ fontSize: 12 }}>
                {costPerConversion != null ? `${formatCurrency(costPerConversion)} c/u` : 'Sin conversiones'}
              </span>
            </div>
            <div className={['card', styles.metricCard].join(' ')}>
              <span className={styles.metricLabel}>Gasto total</span>
              <span className={styles.metricValue}>{formatCurrency(totals.spend)}</span>
            </div>
          </div>

          <div className={styles.charts}>
            <BarChart title="Alcance" data={reachChart} color="var(--info)" />
            <BarChart title="Clicks" data={clicksChart} color="var(--accent)" />
            <BarChart title="Conversiones" data={conversionsChart} color="var(--success)" />
            <BarChart title="Gasto" data={spendChart} color="var(--accent-orange)" formatValue={formatCurrency} />
          </div>

          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Registros</h2>
            </div>

            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Fecha</th>
                    <th>Impresiones</th>
                    <th>Alcance</th>
                    <th>Clicks</th>
                    <th>Conversiones</th>
                    <th>Gasto</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {sortedMetrics.map((m) => (
                    <tr key={m.id}>
                      <td className={styles.name}>{formatDate(m.date)}</td>
                      <td className={styles.muted}>{m.impressions.toLocaleString('es-AR')}</td>
                      <td className={styles.muted}>{m.reach.toLocaleString('es-AR')}</td>
                      <td className={styles.muted}>{m.clicks.toLocaleString('es-AR')}</td>
                      <td className={styles.muted}>{m.conversions.toLocaleString('es-AR')}</td>
                      <td className={styles.muted}>{formatCurrency(m.spend)}</td>
                      <td className={styles.actions}>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(m)}>Editar</Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(m)}>Eliminar</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.cardList}>
              {sortedMetrics.map((m) => (
                <div key={m.id} className={['card', styles.rowCard].join(' ')}>
                  <div className={styles.rowCardHeader}>
                    <span className={styles.name}>{formatDate(m.date)}</span>
                    <span className={styles.muted}>{formatCurrency(m.spend)}</span>
                  </div>
                  <div className={styles.rowCardStats}>
                    <span className={styles.rowCardStatLabel}>Impresiones</span>
                    <span>{m.impressions.toLocaleString('es-AR')}</span>
                    <span className={styles.rowCardStatLabel}>Alcance</span>
                    <span>{m.reach.toLocaleString('es-AR')}</span>
                    <span className={styles.rowCardStatLabel}>Clicks</span>
                    <span>{m.clicks.toLocaleString('es-AR')}</span>
                    <span className={styles.rowCardStatLabel}>Conversiones</span>
                    <span>{m.conversions.toLocaleString('es-AR')}</span>
                  </div>
                  <div className={styles.actions}>
                    <Button variant="ghost" size="sm" onClick={() => openEdit(m)}>Editar</Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(m)}>Eliminar</Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {showModal && <AdMetricFormModal campaignId={id} metric={editing} onClose={closeModal} />}
    </div>
  )
}
