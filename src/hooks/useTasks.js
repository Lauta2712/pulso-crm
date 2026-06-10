import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

const TASK_SELECT =
  '*, projects(id, name), assignee:users!assigned_to(id, full_name, avatar_url), task_tags(tags(id, name, color))'

export function useTasks(filters = {}) {
  return useQuery({
    queryKey: ['tasks', filters],
    queryFn: async () => {
      let query = supabase.from('tasks').select(TASK_SELECT).order('position')

      if (filters.projectId) query = query.eq('project_id', filters.projectId)
      if (filters.assignedTo) query = query.eq('assigned_to', filters.assignedTo)
      if (filters.sprintId) query = query.eq('sprint_id', filters.sprintId)

      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}

export function useTask(id) {
  return useQuery({
    queryKey: ['tasks', 'detail', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('tasks').select(TASK_SELECT).eq('id', id).single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

export function useCreateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (task) => {
      const { data, error } = await supabase.from('tasks').insert(task).select(TASK_SELECT).single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

export function useUpdateTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', id)
        .select(TASK_SELECT)
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['tasks', 'detail', data.id] })
    },
  })
}

export function useDeleteTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id)
      if (error) throw error
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

// Optimistic move between kanban columns. `queryKey` must match the
// queryKey used by the `useTasks` call that renders the board.
export function useMoveTask() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, status, position }) => {
      const { error } = await supabase.from('tasks').update({ status, position }).eq('id', id)
      if (error) throw error
    },
    onMutate: async ({ id, status, position, queryKey }) => {
      await queryClient.cancelQueries({ queryKey })
      const previous = queryClient.getQueryData(queryKey)

      queryClient.setQueryData(queryKey, (old) =>
        old?.map((task) => (task.id === id ? { ...task, status, position } : task))
      )

      return { previous, queryKey }
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(context.queryKey, context.previous)
      }
    },
    onSettled: (_data, _error, _variables, context) => {
      if (context?.queryKey) {
        queryClient.invalidateQueries({ queryKey: context.queryKey })
      }
    },
  })
}

export function useSetTaskTags() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ taskId, tagIds }) => {
      const { error: deleteError } = await supabase.from('task_tags').delete().eq('task_id', taskId)
      if (deleteError) throw deleteError

      if (tagIds.length > 0) {
        const { error: insertError } = await supabase
          .from('task_tags')
          .insert(tagIds.map((tagId) => ({ task_id: taskId, tag_id: tagId })))
        if (insertError) throw insertError
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}
