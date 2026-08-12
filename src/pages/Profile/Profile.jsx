import { useState } from 'react'
import { useUsers, useUpdateUser } from '../../hooks/useUsers'
import { useAuthStore } from '../../store/useAuthStore'
import { useUIStore } from '../../store/useUIStore'
import { supabase } from '../../lib/supabase'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import Skeleton from '../../components/ui/Skeleton'
import styles from './Profile.module.css'

const ROLE_LABELS = {
  owner: 'Owner',
  developer: 'Developer',
  designer: 'Designer',
  pm: 'PM',
  viewer: 'Viewer',
}

const ROLE_VARIANTS = {
  owner: 'accent',
  developer: 'info',
  designer: 'warning',
  pm: 'success',
  viewer: 'muted',
}

export default function Profile() {
  const addToast = useUIStore((state) => state.addToast)
  const session = useAuthStore((state) => state.session)

  const { data: users, isLoading } = useUsers()
  const updateUser = useUpdateUser()
  const currentUser = users?.find((u) => u.id === session?.user?.id)

  const [profileForm, setProfileForm] = useState(null)
  const [passwordForm, setPasswordForm] = useState({ password: '', confirmPassword: '' })
  const [savingPassword, setSavingPassword] = useState(false)

  const profileFormValue =
    profileForm ?? {
      full_name: currentUser?.full_name ?? '',
      avatar_url: currentUser?.avatar_url ?? '',
    }

  const profileChanged =
    currentUser &&
    (profileFormValue.full_name !== (currentUser.full_name ?? '') ||
      profileFormValue.avatar_url !== (currentUser.avatar_url ?? ''))

  const handleSaveProfile = async () => {
    try {
      await updateUser.mutateAsync({ id: currentUser.id, ...profileFormValue })
      addToast('Perfil actualizado')
    } catch (err) {
      console.error(err)
      addToast(err?.message || 'No se pudo guardar el perfil', 'error')
    }
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (passwordForm.password.length < 6) {
      addToast('La contraseña debe tener al menos 6 caracteres', 'error')
      return
    }
    if (passwordForm.password !== passwordForm.confirmPassword) {
      addToast('Las contraseñas no coinciden', 'error')
      return
    }
    setSavingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: passwordForm.password })
      if (error) throw error
      setPasswordForm({ password: '', confirmPassword: '' })
      addToast('Contraseña actualizada')
    } catch (err) {
      addToast(err.message || 'No se pudo actualizar la contraseña', 'error')
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Perfil</h1>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Mis datos</h2>
        <div className="card">
          {isLoading ? (
            <>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className={styles.field}>
                  <Skeleton width="60px" height="11px" style={{ marginBottom: 6 }} />
                  <Skeleton height="36px" />
                </div>
              ))}
            </>
          ) : (
            <>
              <div className={styles.field}>
                <label className={styles.label}>Nombre</label>
                <input
                  value={profileFormValue.full_name}
                  onChange={(e) =>
                    setProfileForm({ ...profileFormValue, full_name: e.target.value })
                  }
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Avatar (URL)</label>
                <input
                  value={profileFormValue.avatar_url}
                  onChange={(e) =>
                    setProfileForm({ ...profileFormValue, avatar_url: e.target.value })
                  }
                  placeholder="https://..."
                />
              </div>
              {profileFormValue.avatar_url && (
                <img
                  src={profileFormValue.avatar_url}
                  alt="Avatar"
                  className={styles.avatarPreview}
                />
              )}
              <div className={styles.field}>
                <label className={styles.label}>Email</label>
                <input value={session?.user?.email ?? ''} disabled />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Rol</label>
                <div>
                  <Badge variant={ROLE_VARIANTS[currentUser?.role] ?? 'muted'}>
                    {ROLE_LABELS[currentUser?.role] ?? currentUser?.role}
                  </Badge>
                </div>
              </div>
              <div style={{ marginTop: 'var(--space-md)' }}>
                <Button
                  onClick={handleSaveProfile}
                  disabled={!profileChanged || updateUser.isPending}
                >
                  {updateUser.isPending ? 'Guardando...' : 'Guardar cambios'}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Contraseña</h2>
        <div className="card">
          <form onSubmit={handleChangePassword}>
            <div className={styles.field}>
              <label className={styles.label}>Nueva contraseña</label>
              <input
                type="password"
                value={passwordForm.password}
                onChange={(e) =>
                  setPasswordForm((f) => ({ ...f, password: e.target.value }))
                }
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <div className={styles.field}>
              <label className={styles.label}>Confirmar contraseña</label>
              <input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm((f) => ({ ...f, confirmPassword: e.target.value }))
                }
              />
            </div>
            <div style={{ marginTop: 'var(--space-md)' }}>
              <Button type="submit" disabled={savingPassword || !passwordForm.password}>
                {savingPassword ? 'Guardando...' : 'Actualizar contraseña'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
