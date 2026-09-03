import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/useAuthStore'

export function useOrg() {
  const session = useAuthStore((s) => s.session)
  const userId = session?.user?.id

  return useQuery({
    queryKey: ['org', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('users')
        .select('orgs(*)')
        .eq('id', userId)
        .single()
      if (error) throw error
      return data.orgs
    },
  })
}

export function useUpdateOrg() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { data, error } = await supabase
        .from('orgs')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['org'] })
    },
  })
}

export function useMyMemberships() {
  const session = useAuthStore((s) => s.session)
  const userId = session?.user?.id

  return useQuery({
    queryKey: ['my-memberships', userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('org_members')
        .select('org_id, role, orgs(id, name, logo_url)')
        .eq('user_id', userId)
      if (error) throw error
      return data.map((m) => ({ ...m.orgs, role: m.role }))
    },
  })
}

export function useSwitchActiveOrg() {
  return useMutation({
    mutationFn: async (orgId) => {
      const { error } = await supabase.rpc('switch_active_org', { target_org_id: orgId })
      if (error) throw error
    },
    onSuccess: () => {
      window.location.reload()
    },
  })
}
