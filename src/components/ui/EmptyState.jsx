import { IconInbox } from './icons'
import styles from './EmptyState.module.css'

export default function EmptyState({ icon = <IconInbox />, title, description, action, compact = false }) {
  return (
    <div className={[styles.wrapper, compact ? styles.compact : ''].join(' ')}>
      <div className={styles.icon}>{icon}</div>
      <div className={styles.title}>{title}</div>
      {description && <div className={styles.description}>{description}</div>}
      {action}
    </div>
  )
}
