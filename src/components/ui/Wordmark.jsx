import CompassMark from './CompassMark'
import styles from './Wordmark.module.css'

export default function Wordmark({ size = 'md' }) {
  return (
    <span className={[styles.wordmark, styles[size]].join(' ')}>
      <CompassMark size={size === 'lg' ? 30 : 20} />
      Compass
    </span>
  )
}
