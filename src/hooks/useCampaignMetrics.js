import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export function useCampaignMetrics(campaignId) {
  return useQuery({
    queryKey: ['campaign-metrics', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('campaign_metrics')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('date', { ascending: true })
      if (error) throw error
      return data
    },
    enabled: !!campaignId,
  })
}

export function useAllCampaignMetrics(filters = {}) {
  return useQuery({
    queryKey: ['campaign-metrics', 'all', filters],
    queryFn: async () => {
      let query = supabase
        .from('campaign_metrics')
        .select('*, campaigns!inner(id, name, platform, status, client_id, clients(id, name))')
        .order('date', { ascending: true })

      if (filters.clientId) query = query.eq('campaigns.client_id', filters.clientId)
      if (filters.platform) query = query.eq('campaigns.platform', filters.platform)

      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}

export function useAddCampaignMetric() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (metric) => {
      const { data, error } = await supabase
        .from('campaign_metrics')
        .insert(metric)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaign-metrics', variables.campaign_id] })
      queryClient.invalidateQueries({ queryKey: ['campaign-metrics', 'all'] })
    },
  })
}

export function useUpdateCampaignMetric() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { data, error } = await supabase
        .from('campaign_metrics')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaign-metrics', variables.campaign_id] })
      queryClient.invalidateQueries({ queryKey: ['campaign-metrics', 'all'] })
    },
  })
}

export function useDeleteCampaignMetric() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id }) => {
      const { error } = await supabase.from('campaign_metrics').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaign-metrics', variables.campaign_id] })
      queryClient.invalidateQueries({ queryKey: ['campaign-metrics', 'all'] })
    },
  })
}
