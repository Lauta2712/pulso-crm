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
import { InvoiceStatusBadge } from '../../components/finance/InvoiceCard'
import TransactionRow from '../../components/finance/TransactionRow'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import Select from '../../components/ui/Select'
import { useUIStore } from '../../store/useUIStore'
import { formatCurrency, formatDate } from '../../lib/format'
import styles from './Finance.module.css'

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

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Finanzas</h1>
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

      <div className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Facturas</h2>
        </div>

        {loadingInvoices && <p style={{ color: 'var(--text-secondary)' }}>Cargando...</p>}

        {!loadingInvoices && (!invoices || invoices.length === 0) && (
          <div className={styles.cardSection}>
            <EmptyState icon="$" title="No hay facturas cargadas" />
          </div>
        )}

        {!loadingInvoices && invoices?.length > 0 && (
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
        )}
      </div>

      <div className={styles.columns}>
        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Transacciones</h2>
            <div className={styles.filters}>
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
          </div>

          <div className="card">
            {loadingTx && <p style={{ color: 'var(--text-secondary)' }}>Cargando...</p>}
            {!loadingTx && (!transactions || transactions.length === 0) && (
              <EmptyState icon="$" title="No hay transacciones" />
            )}
            {!loadingTx &&
              transactions?.map((tx) => <TransactionRow key={tx.id} transaction={tx} />)}
          </div>
        </div>

        <div className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Gastos</h2>
          </div>

          <div className="card">
            {loadingExpenses && <p style={{ color: 'var(--text-secondary)' }}>Cargando...</p>}
            {!loadingExpenses && (!expenses || expenses.length === 0) && (
              <EmptyState icon="$" title="No hay gastos cargados" />
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
    </div>
  )
}
