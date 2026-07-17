import { useState } from 'react'
import { useOrg, useUpdateOrg } from '../../hooks/useOrg'
import { useUsers, useUpdateUserRole } from '../../hooks/useUsers'
import { useCreateTag, useDeleteTag, useTags } from '../../hooks/useTags'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import Select from '../../components/ui/Select'
import Skeleton from '../../components/ui/Skeleton'
import { IconUsers, IconTag } from '../../components/ui/icons'
import { useAuthStore } from '../../store/useAuthStore'
import { useUIStore } from '../../store/useUIStore'
import styles from './Settings.module.css'

const ROLE_OPTIONS = [
  { value: 'owner', label: 'Owner' },
  { value: 'developer', label: 'Developer' },
  { value: 'designer', label: 'Designer' },
  { value: 'pm', label: 'PM' },
  { value: 'viewer', label: 'Viewer' },
]

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

export default function Settings() {
  const addToast = useUIStore((state) => state.addToast)
  const session = useAuthStore((state) => state.session)

  const { data: org, isLoading: loadingOrg } = useOrg()
  const updateOrg = useUpdateOrg()

  const { data: users, isLoading: loadingUsers } = useUsers()
  const updateUserRole = useUpdateUserRole()
  const currentUser = users?.find((u) => u.id === session?.user?.id)
  const isOwner = currentUser?.role === 'owner'

  const { data: tags, isLoading: loadingTags } = useTags()
  const createTag = useCreateTag()
  const deleteTag = useDeleteTag()

  const [orgForm, setOrgForm] = useState(null)
  const [newTag, setNewTag] = useState({ name: '', color: '#7c6af7' })

  const orgFormValue = orgForm ?? { name: org?.name ?? '', logo_url: org?.logo_url ?? '' }

  const handleSaveOrg = async () => {
    try {
      await updateOrg.mutateAsync({ id: org.id, ...orgFormValue })
      addToast('Datos de la organización actualizados')
    } catch {
      addToast('No se pudieron guardar los cambios', 'error')
    }
  }

  const handleRoleChange = async (userId, role) => {
    try {
      await updateUserRole.mutateAsync({ id: userId, role })
      addToast('Rol actualizado')
    } catch {
      addToast('No se pudo actualizar el rol', 'error')
    }
  }

  const handleCreateTag = async (e) => {
    e.preventDefault()
    if (!newTag.name.trim()) return
    try {
      await createTag.mutateAsync(newTag)
      setNewTag({ name: '', color: '#7c6af7' })
      addToast('Tag creado')
    } catch {
      addToast('No se pudo crear el tag', 'error')
    }
  }

  const handleDeleteTag = async (id) => {
    try {
      await deleteTag.mutateAsync(id)
      addToast('Tag eliminado')
    } catch {
      addToast('No se pudo eliminar el tag', 'error')
    }
  }

  const orgChanged =
    org &&
    (orgFormValue.name !== (org.name ?? '') || orgFormValue.logo_url !== (org.logo_url ?? ''))

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Configuración</h1>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Organización</h2>
        <div className="card">
          {loadingOrg ? (
            <>
              {Array.from({ length: 2 }).map((_, i) => (
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
                  value={orgFormValue.name}
                  onChange={(e) => setOrgForm({ ...orgFormValue, name: e.target.value })}
                />
              </div>
              <div className={styles.field}>
                <label className={styles.label}>Logo (URL)</label>
                <input
                  value={orgFormValue.logo_url}
                  onChange={(e) => setOrgForm({ ...orgFormValue, logo_url: e.target.value })}
                  placeholder="https://..."
                />
              </div>
              {orgFormValue.logo_url && (
                <img src={orgFormValue.logo_url} alt="Logo" className={styles.logoPreview} />
              )}
              <div style={{ marginTop: 'var(--space-md)' }}>
                <Button onClick={handleSaveOrg} disabled={!orgChanged || updateOrg.isPending}>
                  {updateOrg.isPending ? 'Guardando...' : 'Guardar cambios'}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Usuarios</h2>
        <div className="card">
          {loadingUsers &&
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={styles.row}>
                <div className={styles.userInfo}>
                  <Skeleton width="32px" height="32px" radius="50%" />
                  <Skeleton width="140px" height="14px" />
                </div>
                <Skeleton width="90px" height="30px" />
              </div>
            ))}
          {!loadingUsers && (!users || users.length === 0) && (
            <EmptyState icon={<IconUsers />} title="No hay usuarios" />
          )}
          {!loadingUsers &&
            users?.map((user) => (
              <div key={user.id} className={styles.row}>
                <div className={styles.userInfo}>
                  <div className={styles.avatar}>{user.full_name?.charAt(0).toUpperCase()}</div>
                  <div>
                    <div className={styles.userName}>{user.full_name}</div>
                  </div>
                </div>
                {isOwner ? (
                  <Select
                    value={user.role}
                    onChange={(value) => handleRoleChange(user.id, value)}
                    className={styles.roleSelect}
                  >
                    {ROLE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </Select>
                ) : (
                  <Badge variant={ROLE_VARIANTS[user.role] ?? 'muted'}>
                    {ROLE_LABELS[user.role] ?? user.role}
                  </Badge>
                )}
              </div>
            ))}
        </div>
      </div>

      <div className={styles.section}>
        <h2 className={styles.sectionTitle}>Tags</h2>
        <div className="card">
          {loadingTags &&
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className={styles.row}>
                <Skeleton width="100px" height="20px" radius="999px" />
              </div>
            ))}
          {!loadingTags && (!tags || tags.length === 0) && (
            <EmptyState icon={<IconTag />} title="No hay tags creados" />
          )}
          {!loadingTags &&
            tags?.map((tag) => (
              <div key={tag.id} className={styles.row}>
                <div className={styles.tagRow}>
                  <span className={styles.swatch} style={{ background: tag.color }} />
                  <span>{tag.name}</span>
                </div>
                <Button size="sm" variant="danger" onClick={() => handleDeleteTag(tag.id)}>
                  Eliminar
                </Button>
              </div>
            ))}

          <form className={styles.tagForm} onSubmit={handleCreateTag}>
            <input
              value={newTag.name}
              onChange={(e) => setNewTag((f) => ({ ...f, name: e.target.value }))}
              placeholder="Nombre del tag"
              required
            />
            <input
              type="color"
              className={styles.colorInput}
              value={newTag.color}
              onChange={(e) => setNewTag((f) => ({ ...f, color: e.target.value }))}
            />
            <Button type="submit" disabled={createTag.isPending}>
              + Agregar
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
