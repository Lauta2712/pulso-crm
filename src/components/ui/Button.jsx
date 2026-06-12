import styles from './Button.module.css'

export default function Button({
  children,
  variant = 'primary',
  size,
  className = '',
  ...props
}) {
  const classes = [styles.btn, styles[variant], size ? styles[size] : '', className]
    .filter(Boolean)
    .join(' ')

  return (
    <button className={classes} {...props}>
      {children}
    </button>
  )
}
