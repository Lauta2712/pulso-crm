import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export function useTeamOverview() {
  return useQuery({
    queryKey: ['team-overview'],
    queryFn: async () => {
      const [usersRes, membersRes, tasksRes] = await Promise.all([
        supabase.from('users').select('*').order('full_name'),
        supabase
          .from('project_members')
          .select('user_id, role, projects(id, name, status, clients(id, name))'),
        supabase.from('tasks').select('assigned_to, status').not('assigned_to', 'is', null),
      ])

      if (usersRes.error) throw usersRes.error
      if (membersRes.error) throw membersRes.error
      if (tasksRes.error) throw tasksRes.error

      return usersRes.data.map((user) => ({
        ...user,
        projects: membersRes.data
          .filter((m) => m.user_id === user.id && m.projects)
          .map((m) => ({ ...m.projects, memberRole: m.role })),
        openTasks: tasksRes.data.filter(
          (t) => t.assigned_to === user.id && t.status !== 'done'
        ).length,
      }))
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
