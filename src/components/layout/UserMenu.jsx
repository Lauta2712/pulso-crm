import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { IconChevronDown, IconLogout } from '../ui/icons'
import styles from './UserMenu.module.css'

const ROLE_LABELS = {
  owner: 'Owner',
  pm: 'PM',
  developer: 'Developer',
  designer: 'Designer',
  viewer: 'Viewer',
}

export default function UserMenu({ email, role, onSignOut }) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState(null)
  const triggerRef = useRef(null)
  const menuRef = useRef(null)
  const initial = email.charAt(0).toUpperCase()

  useLayoutEffect(() => {
    if (!open) return
    const trigger = triggerRef.current
    if (!trigger) return
    const rect = trigger.getBoundingClientRect()
    setPosition({ top: rect.bottom + 6, right: window.innerWidth - rect.right })
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

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={styles.trigger}
        onClick={() => setOpen((o) => !o)}
        aria-label="Cuenta"
      >
        <span className={styles.avatar}>{initial || '?'}</span>
        <IconChevronDown className={[styles.chevron, open ? styles.chevronOpen : ''].join(' ')} />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            className={styles.menu}
            style={{ top: position?.top ?? 0, right: position?.right ?? 0, visibility: position ? 'visible' : 'hidden' }}
          >
            <div className={styles.identity}>
              <span className={styles.email}>{email}</span>
              {role && <span className={styles.role}>{ROLE_LABELS[role] ?? role}</span>}
            </div>
            <button
              type="button"
              className={styles.signOut}
              onClick={() => {
                setOpen(false)
                onSignOut()
              }}
            >
              <IconLogout />
              Cerrar sesión
            </button>
          </div>,
          document.body
        )}
    </>
  )
}
