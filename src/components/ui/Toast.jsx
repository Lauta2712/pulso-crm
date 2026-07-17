import { useUIStore } from '../../store/useUIStore'
import { IconClose } from './icons'
import styles from './Toast.module.css'

export default function Toast() {
  const toasts = useUIStore((state) => state.toasts)
  const removeToast = useUIStore((state) => state.removeToast)

  if (toasts.length === 0) return null

  return (
    <div className={styles.container}>
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={[styles.toast, styles[toast.type] || ''].join(' ')}
          role="status"
          aria-live="polite"
        >
          <span className={styles.message}>{toast.message}</span>
          <button
            type="button"
            className={styles.closeBtn}
            onClick={() => removeToast(toast.id)}
            aria-label="Cerrar notificación"
          >
            <IconClose />
          </button>
        </div>
      ))}
    </div>
  )
}
