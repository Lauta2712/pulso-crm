import { Children, isValidElement, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import styles from './Select.module.css'

const GAP = 4
const MAX_HEIGHT = 280

export default function Select({
  value,
  onChange,
  children,
  placeholder = 'Seleccionar...',
  disabled = false,
  className = '',
}) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState(null)
  const triggerRef = useRef(null)
  const menuRef = useRef(null)

  const options = Children.toArray(children)
    .filter(isValidElement)
    .map((child) => ({
      value: child.props.value,
      label: child.props.children,
      disabled: !!child.props.disabled,
    }))

  const selected = options.find((opt) => String(opt.value) === String(value ?? ''))

  useLayoutEffect(() => {
    if (!open) return

    const update = () => {
      const trigger = triggerRef.current
      const menu = menuRef.current
      if (!trigger || !menu) return

      const triggerRect = trigger.getBoundingClientRect()
      const menuHeight = Math.min(menu.scrollHeight, MAX_HEIGHT)
      const spaceBelow = window.innerHeight - triggerRect.bottom
      const spaceAbove = triggerRect.top
      const openUp = spaceBelow < menuHeight + GAP && spaceAbove > spaceBelow

      setPosition({
        left: triggerRect.left,
        width: triggerRect.width,
        top: openUp
          ? Math.max(GAP, triggerRect.top - menuHeight - GAP)
          : triggerRect.bottom + GAP,
        maxHeight: Math.min(MAX_HEIGHT, (openUp ? spaceAbove : spaceBelow) - GAP * 2),
      })
    }

    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return

    const handlePointerDown = (e) => {
      if (triggerRef.current?.contains(e.target)) return
      if (menuRef.current?.contains(e.target)) return
      setOpen(false)
    }
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const handleSelect = (opt) => {
    if (opt.disabled) return
    onChange?.(opt.value)
    setOpen(false)
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        className={[styles.trigger, open ? styles.open : '', className].filter(Boolean).join(' ')}
        onClick={() => setOpen((o) => !o)}
      >
        <span className={selected ? styles.value : styles.placeholder}>
          {selected ? selected.label : placeholder}
        </span>
        <svg
          className={styles.arrow}
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M4 6l4 4 4-4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            className={styles.menu}
            style={{
              top: position?.top ?? 0,
              left: position?.left ?? 0,
              width: position?.width,
              maxHeight: position?.maxHeight,
              visibility: position ? 'visible' : 'hidden',
            }}
          >
            {options.map((opt) => (
              <div
                key={String(opt.value)}
                className={[
                  styles.option,
                  String(opt.value) === String(value ?? '') ? styles.optionSelected : '',
                  opt.disabled ? styles.optionDisabled : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => handleSelect(opt)}
              >
                {opt.label}
              </div>
            ))}
          </div>,
          document.body
        )}
    </>
  )
}
