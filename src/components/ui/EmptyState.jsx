import styles from './EmptyState.module.css'

export default function EmptyState({ icon = '📭', title, description, action }) {
  return (
    <div className={styles.wrapper}>
      <div className={styles.icon}>{icon}</div>
      <div className={styles.title}>{title}</div>
      {description && <div className={styles.description}>{description}</div>}
      {action}
    </div>
  )
}
