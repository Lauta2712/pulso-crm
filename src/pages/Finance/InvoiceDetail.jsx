import { Link, useParams } from 'react-router-dom'
import { useInvoice, useMarkInvoicePaid } from '../../hooks/useFinance'
import InvoiceCard from '../../components/finance/InvoiceCard'
import TransactionRow from '../../components/finance/TransactionRow'
import EmptyState from '../../components/ui/EmptyState'
import Skeleton, { SkeletonText } from '../../components/ui/Skeleton'
import { IconArrowLeft, IconWallet } from '../../components/ui/icons'
import { useUIStore } from '../../store/useUIStore'
import styles from './Finance.module.css'
import itemStyles from '../../components/finance/Finance.module.css'

export default function InvoiceDetail() {
  const { id } = useParams()
  const { data: invoice, isLoading, isError } = useInvoice(id)
  const markPaid = useMarkInvoicePaid()
  const addToast = useUIStore((state) => state.addToast)

  if (isLoading) {
    return (
      <div className="page">
        <Skeleton width="140px" height="14px" style={{ marginBottom: 'var(--space-sm)' }} />
        <div className="page-header">
          <Skeleton width="200px" height="24px" />
        </div>
        <div className={styles.columns}>
          <div className={['card', itemStyles.invoiceCard].join(' ')}>
            <SkeletonText lines={3} />
          </div>
          <div className="card">
            <Skeleton width="180px" height="15px" style={{ marginBottom: 'var(--space-md)' }} />
            <SkeletonText lines={3} />
          </div>
        </div>
      </div>
    )
  }

  if (isError || !invoice) {
    return (
      <div className="page">
        <p style={{ color: 'var(--danger)' }}>No se pudo cargar la factura.</p>
      </div>
    )
  }

  const handleMarkPaid = async () => {
    try {
      await markPaid.mutateAsync(invoice.id)
      addToast('Factura marcada como pagada')
    } catch (err) {
      console.error(err)
      addToast(err?.message || 'No se pudo actualizar la factura', 'error')
    }
  }

  return (
    <div className="page">
      <Link to="/app/finance" className={styles.backLink}>
        <IconArrowLeft /> Volver a finanzas
      </Link>

      <div className="page-header">
        <h1 className="page-title">Factura {invoice.number}</h1>
      </div>

      <div className={styles.columns}>
        <InvoiceCard invoice={invoice} onMarkPaid={handleMarkPaid} isMarking={markPaid.isPending} />

        <div className="card">
          <h2 style={{ fontSize: 15, fontWeight: 600, marginBottom: 'var(--space-md)' }}>
            Transacciones asociadas
          </h2>
          {invoice.transactions?.length ? (
            invoice.transactions.map((tx) => <TransactionRow key={tx.id} transaction={tx} />)
          ) : (
            <EmptyState icon={<IconWallet />} title="Sin transacciones asociadas" />
          )}
        </div>
      </div>
    </div>
  )
}
