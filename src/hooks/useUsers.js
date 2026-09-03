import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useOrg } from './useOrg'

export function useUsers() {
  const { data: org } = useOrg()

  return useQuery({
    queryKey: ['users', org?.id],
    enabled: !!org?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('org_members')
        .select('id, role, user_id, users(id, full_name, avatar_url, created_at)')
        .eq('org_id', org.id)
        .order('full_name', { foreignTable: 'users' })
      if (error) throw error
      return data.map((m) => ({ ...m.users, role: m.role, org_member_id: m.id }))
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['team-overview'] })
    },
  })
}

export function useUpdateUserRole() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ orgMemberId, role }) => {
      const { data, error } = await supabase
        .from('org_members')
        .update({ role })
        .eq('id', orgMemberId)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      queryClient.invalidateQueries({ queryKey: ['team-overview'] })
    },
  })
}
