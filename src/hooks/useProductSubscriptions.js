import { useMutation, useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export function useProductPlans() {
  return useQuery({
    queryKey: ['product-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')
      if (error) throw error
      return data
    },
  })
}

export function useCreateProductSubscription() {
  return useMutation({
    mutationFn: async ({ planId, contactName, contactEmail, orgName, billingCycle }) => {
      const { data, error } = await supabase.functions.invoke('create-product-subscription', {
        body: { planId, contactName, contactEmail, orgName, billingCycle },
      })
      if (error) throw error
      if (data?.error) throw new Error(data.error)
      return data
    },
  })
}
