import { formatCurrency, formatDate } from '../../lib/format'
import styles from './Finance.module.css'

export default function TransactionRow({ transaction }) {
  const isIncome = transaction.type === 'income'

  return (
    <div className={styles.row}>
      <div className={styles.rowMain}>
        <span className={styles.rowTitle}>{transaction.description || 'Sin descripción'}</span>
        <span className={styles.rowMeta}>
          {transaction.projects?.name ?? 'Sin proyecto'} · {formatDate(transaction.date)}
          {transaction.category && ` · ${transaction.category}`}
        </span>
      </div>
      <span className={[styles.amount, isIncome ? styles.income : styles.expense].join(' ')}>
        {isIncome ? '+' : '-'}
        {formatCurrency(transaction.amount, transaction.currency)}
      </span>
    </div>
  )
}
