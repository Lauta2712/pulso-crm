import EmptyState from '../ui/EmptyState'
import { IconChart } from '../ui/icons'
import styles from './BarChart.module.css'

export default function BarChart({ title, data, color = 'var(--accent)', formatValue, emptyLabel }) {
  const total = data.reduce((sum, d) => sum + d.value, 0)
  const max = Math.max(...data.map((d) => d.value), 1)
  const format = formatValue ?? ((v) => v.toLocaleString('es-AR'))

  return (
    <div className="card">
      <h2 className={styles.title}>{title}</h2>
      {total === 0 ? (
        <EmptyState icon={<IconChart />} title={emptyLabel ?? 'Sin datos todavía'} compact />
      ) : (
        <div className={styles.chart}>
          {data.map((d) => (
            <div key={d.label} className={styles.col}>
              <span className={styles.value}>{format(d.value)}</span>
              <div className={styles.track}>
                <div
                  className={styles.bar}
                  style={{ height: `${Math.max((d.value / max) * 100, d.value > 0 ? 4 : 0)}%`, background: color }}
                />
              </div>
              <span className={styles.label}>{d.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
