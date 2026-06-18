import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export function useMediaAssets(filters = {}) {
  return useQuery({
    queryKey: ['media-assets', filters],
    queryFn: async () => {
      let query = supabase
        .from('media_assets')
        .select('*, clients(id, name), projects(id, name)')
        .order('created_at', { ascending: false })

      if (filters.clientId) query = query.eq('client_id', filters.clientId)
      if (filters.type) query = query.eq('type', filters.type)

      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}

export function useCreateMediaAsset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (asset) => {
      const { data, error } = await supabase.from('media_assets').insert(asset).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-assets'] })
    },
  })
}

export function useUpdateMediaAsset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { data, error } = await supabase
        .from('media_assets')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-assets'] })
    },
  })
}

export function useDeleteMediaAsset() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('media_assets').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-assets'] })
    },
  })
}
