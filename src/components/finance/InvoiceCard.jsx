import Badge from '../ui/Badge'
import Button from '../ui/Button'
import { formatCurrency, formatDate } from '../../lib/format'
import { INVOICE_STATUS_CONFIG } from '../../lib/invoiceStatus'
import styles from './Finance.module.css'

export function InvoiceStatusBadge({ status }) {
  const config = INVOICE_STATUS_CONFIG[status] ?? { label: status, variant: 'muted' }
  return <Badge variant={config.variant}>{config.label}</Badge>
}

export default function InvoiceCard({ invoice, onMarkPaid, isMarking, onClick }) {
  const canMarkPaid = invoice.status !== 'paid' && invoice.status !== 'cancelled'

  return (
    <div
      className={['card', styles.invoiceCard, onClick ? styles.invoiceCardClickable : ''].join(' ')}
      onClick={onClick}
    >
      <div className={styles.invoiceHeader}>
        <div>
          <div className={styles.invoiceNumber}>Factura {invoice.number}</div>
          <div className={styles.invoiceClient}>
            {invoice.clients?.name ?? 'Sin cliente'}
            {invoice.projects?.name && ` · ${invoice.projects.name}`}
          </div>
        </div>
        <InvoiceStatusBadge status={invoice.status} />
      </div>

      <div className={styles.invoiceAmount}>{formatCurrency(invoice.amount, invoice.currency)}</div>

      <div className={styles.invoiceMeta}>
        <div className={styles.invoiceMetaRow}>
          <span className={styles.invoiceMetaLabel}>Emitida</span>
          <span>{formatDate(invoice.issued_date)}</span>
        </div>
        <div className={styles.invoiceMetaRow}>
          <span className={styles.invoiceMetaLabel}>Vencimiento</span>
          <span>{formatDate(invoice.due_date)}</span>
        </div>
        {invoice.paid_date && (
          <div className={styles.invoiceMetaRow}>
            <span className={styles.invoiceMetaLabel}>Pagada</span>
            <span>{formatDate(invoice.paid_date)}</span>
          </div>
        )}
        {invoice.notes && (
          <div className={styles.invoiceMetaRow}>
            <span className={styles.invoiceMetaLabel}>Notas</span>
            <span>{invoice.notes}</span>
          </div>
        )}
      </div>

      {canMarkPaid && onMarkPaid && (
        <Button
          onClick={(e) => {
            e.stopPropagation()
            onMarkPaid()
          }}
          disabled={isMarking}
        >
          {isMarking ? 'Actualizando...' : 'Marcar como pagada'}
        </Button>
      )}
    </div>
  )
}
