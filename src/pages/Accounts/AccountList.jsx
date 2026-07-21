import { useState } from 'react'
import { useAccounts, useDeleteAccount } from '../../hooks/useAccounts'
import AccountFormModal from '../../components/accounts/AccountFormModal'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import EmptyState from '../../components/ui/EmptyState'
import { SkeletonTableRows, SkeletonCard } from '../../components/ui/Skeleton'
import { EyeIcon, EyeOffIcon } from '../../components/ui/PasswordIcons'
import { IconKey, IconExternalLink } from '../../components/ui/icons'
import { useUIStore } from '../../store/useUIStore'
import styles from './Accounts.module.css'

export default function AccountList() {
  const { data: accounts, isLoading, isError } = useAccounts()
  const deleteAccount = useDeleteAccount()
  const addToast = useUIStore((state) => state.addToast)

  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [visiblePasswords, setVisiblePasswords] = useState(new Set())

  const togglePassword = (id) => {
    setVisiblePasswords((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleDelete = async (account) => {
    if (!window.confirm(`¿Eliminar la cuenta "${account.name}"?`)) return
    try {
      await deleteAccount.mutateAsync(account.id)
      addToast('Cuenta eliminada')
    } catch {
      addToast('No se pudo eliminar la cuenta', 'error')
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Cuentas</h1>
        <Button onClick={() => setShowModal(true)}>+ Nueva cuenta</Button>
      </div>

      {isLoading && (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th>Usuario</th>
                  <th>Contraseña</th>
                  <th>URL</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <SkeletonTableRows columns={6} />
              </tbody>
            </table>
          </div>
          <div className={styles.accountCards}>
            {Array.from({ length: 3 }).map((_, i) => (
              <SkeletonCard key={i} lines={4} className={styles.accountCard} />
            ))}
          </div>
        </>
      )}
      {isError && <p style={{ color: 'var(--danger)' }}>Error al cargar las cuentas.</p>}

      {!isLoading && !isError && accounts?.length === 0 && (
        <EmptyState
          icon={<IconKey />}
          title="No hay cuentas registradas"
          description="Cargá las credenciales de las cuentas de Pulso Studio."
          action={<Button onClick={() => setShowModal(true)}>+ Nueva cuenta</Button>}
        />
      )}

      {!isLoading && !isError && accounts?.length > 0 && (
        <>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th>Usuario</th>
                  <th>Contraseña</th>
                  <th>URL</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => {
                  const visible = visiblePasswords.has(account.id)
                  return (
                    <tr key={account.id}>
                      <td className={styles.name}>{account.name}</td>
                      <td>
                        <Badge variant="info">{account.category || 'Otro'}</Badge>
                      </td>
                      <td className={styles.muted}>{account.username || '—'}</td>
                      <td className={styles.muted}>
                        {account.password ? (
                          <div className={styles.passwordCell}>
                            <span className={styles.passwordValue}>
                              {visible ? account.password : '••••••••'}
                            </span>
                            <button
                              type="button"
                              className={styles.iconBtn}
                              onClick={() => togglePassword(account.id)}
                              aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                            >
                              {visible ? <EyeOffIcon /> : <EyeIcon />}
                            </button>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className={styles.muted}>
                        {account.url ? (
                          <a
                            className={styles.urlLink}
                            href={account.url}
                            target="_blank"
                            rel="noreferrer"
                            title={account.url}
                            aria-label={`Abrir URL de ${account.name}`}
                          >
                            <IconExternalLink /> Abrir
                          </a>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className={styles.actions}>
                        <Button variant="ghost" size="sm" onClick={() => setEditing(account)}>
                          Editar
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(account)}>
                          Eliminar
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          <div className={styles.accountCards}>
            {accounts.map((account) => {
              const visible = visiblePasswords.has(account.id)
              return (
                <div key={account.id} className={['card', styles.accountCard].join(' ')}>
                  <div className={styles.accountCardHeader}>
                    <span className={styles.name}>{account.name}</span>
                    <Badge variant="info">{account.category || 'Otro'}</Badge>
                  </div>

                  <div className={styles.accountCardRow}>
                    <span className={styles.accountCardLabel}>Usuario</span>
                    <span className={styles.muted}>{account.username || '—'}</span>
                  </div>

                  <div className={styles.accountCardRow}>
                    <span className={styles.accountCardLabel}>Contraseña</span>
                    {account.password ? (
                      <div className={styles.passwordCell}>
                        <span className={styles.passwordValue}>
                          {visible ? account.password : '••••••••'}
                        </span>
                        <button
                          type="button"
                          className={styles.iconBtn}
                          onClick={() => togglePassword(account.id)}
                          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                        >
                          {visible ? <EyeOffIcon /> : <EyeIcon />}
                        </button>
                      </div>
                    ) : (
                      <span className={styles.muted}>—</span>
                    )}
                  </div>

                  <div className={styles.accountCardRow}>
                    <span className={styles.accountCardLabel}>URL</span>
                    {account.url ? (
                      <a
                        className={styles.urlLink}
                        href={account.url}
                        target="_blank"
                        rel="noreferrer"
                        title={account.url}
                        aria-label={`Abrir URL de ${account.name}`}
                      >
                        <IconExternalLink /> Abrir
                      </a>
                    ) : (
                      <span className={styles.muted}>—</span>
                    )}
                  </div>

                  <div className={styles.accountCardActions}>
                    <Button variant="ghost" size="sm" onClick={() => setEditing(account)}>
                      Editar
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(account)}>
                      Eliminar
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {showModal && <AccountFormModal onClose={() => setShowModal(false)} />}
      {editing && <AccountFormModal account={editing} onClose={() => setEditing(null)} />}
    </div>
  )
}
