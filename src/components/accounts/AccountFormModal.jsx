import { useState } from 'react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Select from '../ui/Select'
import { EyeIcon, EyeOffIcon } from '../ui/PasswordIcons'
import { useCreateAccount, useUpdateAccount } from '../../hooks/useAccounts'
import { useUIStore } from '../../store/useUIStore'
import styles from './AccountFormModal.module.css'

export const ACCOUNT_CATEGORIES = [
  'Hosting',
  'Dominio',
  'Email',
  'Redes sociales',
  'Software / SaaS',
  'Banco',
  'Otro',
]

export default function AccountFormModal({ account, onClose }) {
  const isEditing = !!account
  const addToast = useUIStore((state) => state.addToast)
  const createAccount = useCreateAccount()
  const updateAccount = useUpdateAccount()
  const [showPassword, setShowPassword] = useState(false)

  const [form, setForm] = useState({
    name: account?.name ?? '',
    category: account?.category ?? ACCOUNT_CATEGORIES[0],
    url: account?.url ?? '',
    username: account?.username ?? '',
    password: account?.password ?? '',
    notes: account?.notes ?? '',
  })

  const handleChange = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }))
  const handleSelectChange = (field) => (value) => setForm((f) => ({ ...f, [field]: value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (isEditing) {
        await updateAccount.mutateAsync({ id: account.id, ...form })
        addToast('Cuenta actualizada')
      } else {
        await createAccount.mutateAsync(form)
        addToast('Cuenta creada')
      }
      onClose()
    } catch (err) {
      console.error(err)
      addToast(err?.message || 'No se pudo guardar la cuenta', 'error')
    }
  }

  const isPending = createAccount.isPending || updateAccount.isPending

  return (
    <Modal title={isEditing ? 'Editar cuenta' : 'Nueva cuenta'} onClose={onClose}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>Nombre</label>
            <input
              value={form.name}
              onChange={handleChange('name')}
              placeholder="Hostinger, Gmail Pulso..."
              required
              autoFocus
            />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Categoría</label>
            <Select value={form.category} onChange={handleSelectChange('category')}>
              {ACCOUNT_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>URL</label>
          <input
            type="url"
            value={form.url}
            onChange={handleChange('url')}
            placeholder="https://..."
          />
        </div>

        <div className={styles.row}>
          <div className={styles.field}>
            <label className={styles.label}>Usuario / Email</label>
            <input value={form.username} onChange={handleChange('username')} />
          </div>
          <div className={styles.field}>
            <label className={styles.label}>Contraseña</label>
            <div className={styles.passwordWrapper}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={handleChange('password')}
                autoComplete="off"
              />
              <button
                type="button"
                className={styles.togglePassword}
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                tabIndex={-1}
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            </div>
          </div>
        </div>

        <div className={styles.field}>
          <label className={styles.label}>Notas</label>
          <textarea className={styles.textarea} value={form.notes} onChange={handleChange('notes')} />
        </div>

        <div className={styles.actions}>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Guardando...' : 'Guardar'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}
