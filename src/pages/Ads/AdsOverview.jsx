import { useMemo, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useCampaigns } from '../../hooks/useCampaigns'
import { useAllCampaignMetrics } from '../../hooks/useCampaignMetrics'
import { useClients } from '../../hooks/useClients'
import Select from '../../components/ui/Select'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import Skeleton, { SkeletonTableRows, SkeletonCard } from '../../components/ui/Skeleton'
import BarChart from '../../components/dashboard/BarChart'
import { interactiveRowProps } from '../../lib/a11y'
import { IconChart } from '../../components/ui/icons'
import { CAMPAIGN_STATUS_CONFIG, CAMPAIGN_PLATFORM_LABEL } from '../../lib/campaignMeta'
import { formatCurrency } from '../../lib/format'
import styles from './Ads.module.css'

const EMPTY_TOTALS = { impressions: 0, reach: 0, clicks: 0, conversions: 0, spend: 0 }

export default function AdsOverview() {
  const navigate = useNavigate()
  const [clientId, setClientId] = useState('')
  const [platform, setPlatform] = useState('')

  const filters = useMemo(() => {
    const f = {}
    if (clientId) f.clientId = clientId
    if (platform) f.platform = platform
    return f
  }, [clientId, platform])

  const { data: campaigns, isLoading: loadingCampaigns } = useCampaigns(filters)
  const { data: metricRows, isLoading: loadingMetrics } = useAllCampaignMetrics(filters)
  const { data: clients } = useClients()

  const isLoading = loadingCampaigns || loadingMetrics

  const totalsByCampaign = useMemo(() => {
    const map = new Map()
    metricRows?.forEach((row) => {
      const existing = map.get(row.campaign_id) ?? { ...EMPTY_TOTALS }
      existing.impressions += row.impressions
      existing.reach += row.reach
      existing.clicks += row.clicks
      existing.conversions += row.conversions
      existing.spend += Number(row.spend)
      map.set(row.campaign_id, existing)
    })
    return map
  }, [metricRows])

  const campaignRows = useMemo(
    () =>
      (campaigns ?? []).map((campaign) => {
        const totals = totalsByCampaign.get(campaign.id) ?? EMPTY_TOTALS
        const ctr = totals.impressions > 0 ? (totals.clicks / totals.impressions) * 100 : 0
        const costPerConversion = totals.conversions > 0 ? totals.spend / totals.conversions : null
        return { campaign, ...totals, ctr, costPerConversion }
      }),
    [campaigns, totalsByCampaign]
  )

  const grandTotals = campaignRows.reduce(
    (acc, row) => ({
      impressions: acc.impressions + row.impressions,
      reach: acc.reach + row.reach,
      clicks: acc.clicks + row.clicks,
      conversions: acc.conversions + row.conversions,
      spend: acc.spend + row.spend,
    }),
    { ...EMPTY_TOTALS }
  )

  const spendByPlatform = Object.entries(CAMPAIGN_PLATFORM_LABEL)
    .map(([platformKey, label]) => ({
      label,
      value: campaignRows
        .filter((row) => row.campaign.platform === platformKey)
        .reduce((s, row) => s + row.spend, 0),
    }))
    .filter((row) => row.value > 0)

  const conversionsByCampaign = campaignRows
    .filter((row) => row.conversions > 0)
    .sort((a, b) => b.conversions - a.conversions)
    .slice(0, 8)
    .map((row) => ({ label: row.campaign.name, value: row.conversions }))

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Publicidades</h1>
        <Link to="/app/campaigns">
          <Button variant="secondary">Gestionar campañas</Button>
        </Link>
      </div>

      <div className={styles.filters}>
        <Select value={clientId} onChange={setClientId} className={styles.filterSelect}>
          <option value="">Todos los clientes</option>
          {clients?.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </Select>
        <Select value={platform} onChange={setPlatform} className={styles.filterSelect}>
          <option value="">Todas las plataformas</option>
          {Object.entries(CAMPAIGN_PLATFORM_LABEL).map(([k, label]) => (
            <option key={k} value={k}>{label}</option>
          ))}
        </Select>
      </div>

      {isLoading && (
        <>
          <div className={styles.metrics}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className={['card', styles.metricCard].join(' ')}>
                <Skeleton width="60%" height="12px" />
                <Skeleton width="40%" height="26px" />
              </div>
            ))}
          </div>

          <div className={styles.charts}>
            {Array.from({ length: 2 }).map((_, i) => (
              <div key={i} className="card">
                <Skeleton width="50%" height="14px" style={{ marginBottom: 'var(--space-md)' }} />
                <Skeleton height="140px" />
              </div>
            ))}
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Cliente</th>
                  <th>Plataforma</th>
                  <th>Estado</th>
                  <th>Alcance</th>
                  <th>Clicks</th>
                  <th>CTR</th>
                  <th>Conversiones</th>
                  <th>Gasto</th>
                </tr>
              </thead>
              <tbody>
                <SkeletonTableRows columns={9} />
              </tbody>
            </table>
          </div>
          <div className={styles.cardList}>
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} lines={4} className={styles.rowCard} />
            ))}
          </div>
        </>
      )}

      {!isLoading && campaignRows.length === 0 && (
        <EmptyState
          icon={<IconChart />}
          title="No hay publicidades para trackear"
          description="Creá una campaña para empezar a cargar sus métricas de rendimiento."
          action={<Link to="/app/campaigns"><Button>+ Nueva campaña</Button></Link>}
        />
      )}

      {!isLoading && campaignRows.length > 0 && (
        <>
          <div className={styles.metrics}>
            <div className={['card', styles.metricCard].join(' ')}>
              <span className={styles.metricLabel}>Inversión total</span>
              <span className={styles.metricValue}>{formatCurrency(grandTotals.spend)}</span>
            </div>
            <div className={['card', styles.metricCard].join(' ')}>
              <span className={styles.metricLabel}>Alcance total</span>
              <span className={styles.metricValue}>{grandTotals.reach.toLocaleString('es-AR')}</span>
            </div>
            <div className={['card', styles.metricCard].join(' ')}>
              <span className={styles.metricLabel}>Clicks totales</span>
              <span className={styles.metricValue}>{grandTotals.clicks.toLocaleString('es-AR')}</span>
            </div>
            <div className={['card', styles.metricCard].join(' ')}>
              <span className={styles.metricLabel}>Conversiones</span>
              <span className={styles.metricValue}>{grandTotals.conversions.toLocaleString('es-AR')}</span>
            </div>
          </div>

          <div className={styles.charts}>
            <BarChart
              title="Gasto por plataforma"
              data={spendByPlatform}
              color="var(--accent)"
              formatValue={formatCurrency}
              emptyLabel="Todavía no cargaste gasto"
            />
            <BarChart
              title="Conversiones por campaña"
              data={conversionsByCampaign}
              color="var(--success)"
              emptyLabel="Todavía no cargaste conversiones"
            />
          </div>

          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Campañas</h2>
            </div>

            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Cliente</th>
                    <th>Plataforma</th>
                    <th>Estado</th>
                    <th>Alcance</th>
                    <th>Clicks</th>
                    <th>CTR</th>
                    <th>Conversiones</th>
                    <th>Gasto</th>
                  </tr>
                </thead>
                <tbody>
                  {campaignRows.map(({ campaign, reach, clicks, conversions, spend, ctr }) => (
                    <tr
                      key={campaign.id}
                      className={styles.tableRow}
                      onClick={() => navigate(`/app/ads/${campaign.id}`)}
                      {...interactiveRowProps(() => navigate(`/app/ads/${campaign.id}`))}
                    >
                      <td className={styles.name}>{campaign.name}</td>
                      <td className={styles.muted}>{campaign.clients?.name ?? '—'}</td>
                      <td><Badge variant="info">{CAMPAIGN_PLATFORM_LABEL[campaign.platform]}</Badge></td>
                      <td>
                        <Badge variant={CAMPAIGN_STATUS_CONFIG[campaign.status]?.variant}>
                          {CAMPAIGN_STATUS_CONFIG[campaign.status]?.label}
                        </Badge>
                      </td>
                      <td className={styles.muted}>{reach.toLocaleString('es-AR')}</td>
                      <td className={styles.muted}>{clicks.toLocaleString('es-AR')}</td>
                      <td className={styles.muted}>{ctr.toFixed(2)}%</td>
                      <td className={styles.muted}>{conversions.toLocaleString('es-AR')}</td>
                      <td className={styles.muted}>{formatCurrency(spend)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.cardList}>
              {campaignRows.map(({ campaign, reach, clicks, conversions, spend, ctr }) => (
                <div
                  key={campaign.id}
                  className={['card', styles.rowCard, styles.rowCardClickable].join(' ')}
                  onClick={() => navigate(`/app/ads/${campaign.id}`)}
                  {...interactiveRowProps(() => navigate(`/app/ads/${campaign.id}`))}
                >
                  <div className={styles.rowCardHeader}>
                    <span className={styles.name}>{campaign.name}</span>
                    <Badge variant={CAMPAIGN_STATUS_CONFIG[campaign.status]?.variant}>
                      {CAMPAIGN_STATUS_CONFIG[campaign.status]?.label}
                    </Badge>
                  </div>
                  <div className={styles.rowCardMeta}>
                    <Badge variant="info">{CAMPAIGN_PLATFORM_LABEL[campaign.platform]}</Badge>
                    <span className={styles.muted}>{campaign.clients?.name ?? 'Sin cliente'}</span>
                  </div>
                  <div className={styles.rowCardStats}>
                    <span className={styles.rowCardStatLabel}>Alcance</span>
                    <span>{reach.toLocaleString('es-AR')}</span>
                    <span className={styles.rowCardStatLabel}>Clicks</span>
                    <span>{clicks.toLocaleString('es-AR')}</span>
                    <span className={styles.rowCardStatLabel}>CTR</span>
                    <span>{ctr.toFixed(2)}%</span>
                    <span className={styles.rowCardStatLabel}>Conversiones</span>
                    <span>{conversions.toLocaleString('es-AR')}</span>
                    <span className={styles.rowCardStatLabel}>Gasto</span>
                    <span>{formatCurrency(spend)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
