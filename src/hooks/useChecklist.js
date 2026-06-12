import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export function useChecklistItems(taskId) {
  return useQuery({
    queryKey: ['checklist', taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('task_checklist_items')
        .select('*')
        .eq('task_id', taskId)
        .order('position')
      if (error) throw error
      return data
    },
    enabled: !!taskId,
  })
}

export function useAddChecklistItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ taskId, title, position }) => {
      const { data, error } = await supabase
        .from('task_checklist_items')
        .insert({ task_id: taskId, title, position })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['checklist', data.task_id] })
    },
  })
}

export function useToggleChecklistItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, isDone }) => {
      const { data, error } = await supabase
        .from('task_checklist_items')
        .update({ is_done: isDone })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['checklist', data.task_id] })
    },
  })
}

export function useDeleteChecklistItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, taskId }) => {
      const { error } = await supabase.from('task_checklist_items').delete().eq('id', id)
      if (error) throw error
      return { id, taskId }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['checklist', data.taskId] })
    },
  })
}
