import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  useExpenses,
  useFinanceSummary,
  useInvoices,
  useMarkInvoicePaid,
  useTransactions,
} from '../../hooks/useFinance'
import { useProjects } from '../../hooks/useProjects'
import InvoiceCard, { InvoiceStatusBadge } from '../../components/finance/InvoiceCard'
import TransactionRow from '../../components/finance/TransactionRow'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import Select from '../../components/ui/Select'
import Skeleton, { SkeletonTableRows, SkeletonCard } from '../../components/ui/Skeleton'
import { IconWallet } from '../../components/ui/icons'
import BarChart from '../../components/dashboard/BarChart'
import { useUIStore } from '../../store/useUIStore'
import { formatCurrency, formatDate } from '../../lib/format'
import { INVOICE_STATUS_CONFIG } from '../../lib/invoiceStatus'
import styles from './Finance.module.css'
import itemStyles from '../../components/finance/Finance.module.css'
import { interactiveRowProps } from '../../lib/a11y'

export default function FinanceDashboard() {
  const navigate = useNavigate()
  const addToast = useUIStore((state) => state.addToast)

  const { data: summary } = useFinanceSummary()
  const { data: invoices, isLoading: loadingInvoices } = useInvoices()
  const { data: expenses, isLoading: loadingExpenses } = useExpenses()
  const { data: projects } = useProjects()
  const markPaid = useMarkInvoicePaid()

  const [txProject, setTxProject] = useState('')
  const [txType, setTxType] = useState('')

  const txFilters = {}
  if (txProject) txFilters.projectId = txProject
  if (txType) txFilters.type = txType
  const { data: transactions, isLoading: loadingTx } = useTransactions(txFilters)

  const handleMarkPaid = async (id) => {
    try {
      await markPaid.mutateAsync(id)
      addToast('Factura marcada como pagada')
    } catch {
      addToast('No se pudo actualizar la factura', 'error')
    }
  }

  const incomeExpenseChart = [
    { label: 'Ingresos', value: summary?.income ?? 0 },
    { label: 'Gastos', value: summary?.expense ?? 0 },
  ]

  const invoicesByStatus = Object.entries(INVOICE_STATUS_CONFIG)
    .map(([status, config]) => ({
      label: config.label,
      value: invoices?.filter((inv) => inv.status === status).length ?? 0,
    }))
    .filter((row) => row.value > 0)

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Finanzas</h1>
      </div>

      <div className={styles.charts}>
        <BarChart
          title="Ingresos vs gastos (mes)"
          data={incomeExpenseChart}
          color="var(--info)"
          formatValue={formatCurrency}
        />
        <BarChart
          title="Facturas por estado"
          data={invoicesByStatus}
          color="var(--accent)"
          emptyLabel="No hay facturas cargadas"
        />
      </div>

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Facturas</h2>
        </div>

        {loadingInvoices && (
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Número</th>
                    <th>Cliente</th>
                    <th>Estado</th>
                    <th>Monto</th>
                    <th>Vencimiento</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  <SkeletonTableRows columns={6} />
                </tbody>
              </table>
            </div>
            <div className={styles.invoiceCards}>
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonCard key={i} lines={4} className={itemStyles.invoiceCard} />
              ))}
            </div>
          </>
        )}

        {!loadingInvoices && (!invoices || invoices.length === 0) && (
          <div className={styles.cardSection}>
            <EmptyState icon={<IconWallet />} title="No hay facturas cargadas" />
          </div>
        )}

        {!loadingInvoices && invoices?.length > 0 && (
          <>
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Número</th>
                    <th>Cliente</th>
                    <th>Estado</th>
                    <th>Monto</th>
                    <th>Vencimiento</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr
                      key={invoice.id}
                      className={styles.tableRow}
                      onClick={() => navigate(`/app/finance/invoices/${invoice.id}`)}
                      {...interactiveRowProps(() => navigate(`/app/finance/invoices/${invoice.id}`))}
                    >
                      <td>{invoice.number}</td>
                      <td className={styles.muted}>{invoice.clients?.name ?? '—'}</td>
                      <td>
                        <InvoiceStatusBadge status={invoice.status} />
                      </td>
                      <td className={styles.amount}>
                        {formatCurrency(invoice.amount, invoice.currency)}
                      </td>
                      <td className={styles.muted}>{formatDate(invoice.due_date)}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        {invoice.status !== 'paid' && invoice.status !== 'cancelled' && (
                          <Button size="sm" variant="secondary" onClick={() => handleMarkPaid(invoice.id)}>
                            Marcar pagada
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className={styles.invoiceCards}>
              {invoices.map((invoice) => (
                <InvoiceCard
                  key={invoice.id}
                  invoice={invoice}
                  onClick={() => navigate(`/app/finance/invoices/${invoice.id}`)}
                  onMarkPaid={() => handleMarkPaid(invoice.id)}
                  isMarking={markPaid.isPending}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <div className={styles.columns}>
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Transacciones</h2>
          </div>
          <div className={styles.filters} style={{ marginBottom: 'var(--space-md)' }}>
            <Select value={txProject} onChange={setTxProject} className={styles.filterSelect}>
              <option value="">Todos los proyectos</option>
              {projects?.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
            <Select value={txType} onChange={setTxType} className={styles.filterSelect}>
              <option value="">Todos</option>
              <option value="income">Ingresos</option>
              <option value="expense">Egresos</option>
            </Select>
          </div>

          <div className={styles.listCard}>
            {loadingTx &&
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={itemStyles.row}>
                  <div className={itemStyles.rowMain}>
                    <Skeleton width="140px" height="13px" />
                    <Skeleton width="100px" height="12px" />
                  </div>
                  <Skeleton width="70px" height="14px" />
                </div>
              ))}
            {!loadingTx && (!transactions || transactions.length === 0) && (
              <EmptyState icon={<IconWallet />} title="No hay transacciones" />
            )}
            {!loadingTx &&
              transactions?.map((tx) => <TransactionRow key={tx.id} transaction={tx} />)}
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Gastos</h2>
          </div>

          <div className={styles.listCard}>
            {loadingExpenses &&
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className={styles.expenseRow}>
                  <Skeleton width="45%" height="13px" />
                  <Skeleton width="70px" height="13px" />
                </div>
              ))}
            {!loadingExpenses && (!expenses || expenses.length === 0) && (
              <EmptyState icon={<IconWallet />} title="No hay gastos cargados" />
            )}
            {!loadingExpenses &&
              expenses?.map((expense) => (
                <div key={expense.id} className={styles.expenseRow}>
                  <div>
                    <div className={styles.expenseTitle}>
                      {expense.description}
                      {expense.recurrent && (
                        <Badge variant="accent" className={styles.recurrentBadge}>
                          Recurrente
                        </Badge>
                      )}
                    </div>
                    <div className={styles.muted}>
                      {formatDate(expense.date)}
                      {expense.category && ` · ${expense.category}`}
                    </div>
                  </div>
                  <span className={styles.amount}>
                    {formatCurrency(expense.amount, expense.currency)}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>

      <div className={styles.metrics}>
        <div className={['card', styles.metricCard].join(' ')}>
          <span className={styles.metricLabel}>Ingresos del mes</span>
          <span className={styles.metricValue}>{formatCurrency(summary?.income)}</span>
        </div>
        <div className={['card', styles.metricCard].join(' ')}>
          <span className={styles.metricLabel}>Gastos del mes</span>
          <span className={styles.metricValue}>{formatCurrency(summary?.expense)}</span>
        </div>
        <div className={['card', styles.metricCard].join(' ')}>
          <span className={styles.metricLabel}>Balance</span>
          <span className={styles.metricValue}>{formatCurrency(summary?.balance)}</span>
        </div>
        <div className={['card', styles.metricCard].join(' ')}>
          <span className={styles.metricLabel}>Por cobrar</span>
          <span className={styles.metricValue}>{formatCurrency(summary?.receivable)}</span>
        </div>
      </div>
    </div>
  )
}
