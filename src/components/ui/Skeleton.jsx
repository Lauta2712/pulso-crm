import styles from './Skeleton.module.css'

export default function Skeleton({ width, height = '14px', radius, className = '', style }) {
  return (
    <div
      className={[styles.skeleton, className].join(' ')}
      style={{ width, height, borderRadius: radius, ...style }}
    />
  )
}

export function SkeletonText({ lines = 1, width }) {
  return (
    <div className={styles.textGroup}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height="14px"
          width={width ?? (i === lines - 1 && lines > 1 ? '60%' : '100%')}
        />
      ))}
    </div>
  )
}

export function SkeletonTableRows({ columns, rows = 5 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: columns }).map((_, j) => (
            <td key={j}>
              <Skeleton width={j === 0 ? '70%' : '50%'} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}

export function SkeletonCard({ lines = 3, className = '' }) {
  return (
    <div className={['card', className].join(' ')}>
      <SkeletonText lines={lines} />
    </div>
  )
}
