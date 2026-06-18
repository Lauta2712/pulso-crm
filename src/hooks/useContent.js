import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export function useContentPosts(filters = {}) {
  return useQuery({
    queryKey: ['content-posts', filters],
    queryFn: async () => {
      let query = supabase
        .from('content_posts')
        .select('*, clients(id, name), projects(id, name)')
        .order('scheduled_at', { ascending: true, nullsFirst: false })

      if (filters.clientId) query = query.eq('client_id', filters.clientId)
      if (filters.status) query = query.eq('status', filters.status)
      if (filters.platform) query = query.eq('platform', filters.platform)
      if (filters.from) query = query.gte('scheduled_at', filters.from)
      if (filters.to) query = query.lte('scheduled_at', filters.to)

      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}

export function useCreateContentPost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (post) => {
      const { data, error } = await supabase.from('content_posts').insert(post).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-posts'] })
    },
  })
}

export function useUpdateContentPost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { data, error } = await supabase
        .from('content_posts')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-posts'] })
    },
  })
}

export function useDeleteContentPost() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('content_posts').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-posts'] })
    },
  })
}
