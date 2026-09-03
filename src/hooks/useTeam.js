import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useOrg } from './useOrg'

export function useTeamOverview() {
  const { data: org } = useOrg()

  return useQuery({
    queryKey: ['team-overview', org?.id],
    enabled: !!org?.id,
    queryFn: async () => {
      const [membershipsRes, membersRes, tasksRes] = await Promise.all([
        supabase
          .from('org_members')
          .select('id, role, user_id, users(id, full_name, avatar_url, created_at)')
          .eq('org_id', org.id)
          .order('full_name', { foreignTable: 'users' }),
        supabase
          .from('project_members')
          .select('user_id, role, projects(id, name, status, clients(id, name))'),
        supabase.from('tasks').select('assigned_to, status').not('assigned_to', 'is', null),
      ])

      if (membershipsRes.error) throw membershipsRes.error
      if (membersRes.error) throw membersRes.error
      if (tasksRes.error) throw tasksRes.error

      return membershipsRes.data.map((m) => {
        const user = m.users
        return {
          ...user,
          role: m.role,
          org_member_id: m.id,
          projects: membersRes.data
            .filter((pm) => pm.user_id === user.id && pm.projects)
            .map((pm) => ({ ...pm.projects, memberRole: pm.role })),
          openTasks: tasksRes.data.filter(
            (t) => t.assigned_to === user.id && t.status !== 'done'
          ).length,
        }
      })
    },
  })
}

export function useCreateTeamMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ email, full_name, role, password }) => {
      const { data, error } = await supabase.functions.invoke('create-team-member', {
        body: { email, full_name, role, password },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-overview'] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}

export function useDeleteTeamMember() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (userId) => {
      const { data, error } = await supabase.functions.invoke('delete-team-member', {
        body: { user_id: userId },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-overview'] })
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}
