import { useState } from 'react'
import { useTeamOverview, useDeleteTeamMember } from '../../hooks/useTeam'
import { useAuthStore } from '../../store/useAuthStore'
import { useUIStore } from '../../store/useUIStore'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import EmptyState from '../../components/ui/EmptyState'
import { SkeletonCard } from '../../components/ui/Skeleton'
import { IconUsers } from '../../components/ui/icons'
import InviteMemberModal from '../../components/team/InviteMemberModal'
import EditMemberModal from '../../components/team/EditMemberModal'
import styles from './Team.module.css'

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

export default function Team() {
  const { data: team, isLoading, isError } = useTeamOverview()
  const session = useAuthStore((state) => state.session)
  const addToast = useUIStore((state) => state.addToast)
  const deleteTeamMember = useDeleteTeamMember()
  const [inviting, setInviting] = useState(false)
  const [editingMember, setEditingMember] = useState(null)

  const currentMember = team?.find((member) => member.id === session?.user?.id)
  const isOwner = currentMember?.role === 'owner'

  const handleDelete = async (member) => {
    if (!window.confirm(`¿Eliminar a ${member.full_name} del equipo?`)) return
    try {
      await deleteTeamMember.mutateAsync(member.id)
      addToast('Integrante eliminado')
    } catch (err) {
      addToast(err.message || 'No se pudo eliminar al integrante', 'error')
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <h1 className="page-title">Equipo</h1>
        {isOwner && <Button onClick={() => setInviting(true)}>+ Nuevo integrante</Button>}
      </div>

      {inviting && <InviteMemberModal onClose={() => setInviting(false)} />}
      {editingMember && (
        <EditMemberModal member={editingMember} onClose={() => setEditingMember(null)} />
      )}

      {isLoading && (
        <div className={styles.grid}>
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} lines={2} className={styles.card} />
          ))}
        </div>
      )}
      {isError && <p style={{ color: 'var(--danger)' }}>Error al cargar el equipo.</p>}

      {!isLoading && !isError && (!team || team.length === 0) && (
        <EmptyState icon={<IconUsers />} title="No hay integrantes" />
      )}

      {!isLoading && !isError && team?.length > 0 && (
        <div className={styles.grid}>
          {team.map((member) => (
            <div key={member.id} className={['card', styles.card].join(' ')}>
              <div className={styles.header}>
                <div className={styles.avatar}>{member.full_name?.charAt(0).toUpperCase()}</div>
                <div className={styles.headerInfo}>
                  <span className={styles.name}>{member.full_name}</span>
                  <Badge variant={ROLE_VARIANTS[member.role] ?? 'muted'}>
                    {ROLE_LABELS[member.role] ?? member.role}
                  </Badge>
                </div>
              </div>

              {isOwner && (
                <div className={styles.actions}>
                  <Button size="sm" variant="ghost" onClick={() => setEditingMember(member)}>
                    Editar
                  </Button>
                  {member.id !== session?.user?.id && (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(member)}
                      disabled={deleteTeamMember.isPending}
                    >
                      Eliminar
                    </Button>
                  )}
                </div>
              )}

              <div className={styles.tasksCount}>
                Tareas activas: <span className={styles.tasksValue}>{member.openTasks}</span>
              </div>

              <div>
                <div className={styles.sectionLabel}>Proyectos</div>
                {member.projects.length > 0 ? (
                  <div className={styles.projectList}>
                    {member.projects.map((project) => (
                      <div key={project.id} className={styles.projectItem}>
                        <span className={styles.projectName}>{project.name}</span>
                        {project.clients?.name && (
                          <span className={styles.projectClient}>{project.clients.name}</span>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className={styles.noProjects}>Sin proyectos asignados</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
