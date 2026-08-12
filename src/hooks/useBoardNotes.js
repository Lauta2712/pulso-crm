import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

const NOTES_QUERY_KEY = ['board-notes']

export function useBoardNotes() {
  return useQuery({
    queryKey: NOTES_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, color, status, position')
        .is('project_id', null)
        .order('position')

      if (error) throw error
      return data
    },
  })
}

export function useCreateBoardNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ title, color }) => {
      const notes = queryClient.getQueryData(NOTES_QUERY_KEY)
      const position = notes?.length ?? 0

      const { data, error } = await supabase
        .from('tasks')
        .insert({ project_id: null, title, color, status: 'todo', position })
        .select('id, title, color, status, position')
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEY })
    },
  })
}

export function useUpdateBoardNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      const { error } = await supabase.from('tasks').update(updates).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEY })
    },
  })
}

export function useToggleBoardNoteDone() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, done }) => {
      const status = done ? 'done' : 'todo'
      const { error } = await supabase.from('tasks').update({ status }).eq('id', id)
      if (error) throw error
    },
    onMutate: async ({ id, done }) => {
      await queryClient.cancelQueries({ queryKey: NOTES_QUERY_KEY })
      const previous = queryClient.getQueryData(NOTES_QUERY_KEY)

      queryClient.setQueryData(NOTES_QUERY_KEY, (old) =>
        old?.map((note) => (note.id === id ? { ...note, status: done ? 'done' : 'todo' } : note))
      )

      return { previous }
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(NOTES_QUERY_KEY, context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEY })
    },
  })
}

export function useReorderBoardNotes() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (orderedIds) => {
      await Promise.all(
        orderedIds.map((id, position) =>
          supabase.from('tasks').update({ position }).eq('id', id).then(({ error }) => {
            if (error) throw error
          })
        )
      )
    },
    onMutate: async (orderedIds) => {
      await queryClient.cancelQueries({ queryKey: NOTES_QUERY_KEY })
      const previous = queryClient.getQueryData(NOTES_QUERY_KEY)

      queryClient.setQueryData(NOTES_QUERY_KEY, (old) => {
        if (!old) return old
        const byId = new Map(old.map((note) => [note.id, note]))
        return orderedIds.map((id, position) => ({ ...byId.get(id), position }))
      })

      return { previous }
    },
    onError: (_err, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(NOTES_QUERY_KEY, context.previous)
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEY })
    },
  })
}

export function useDeleteBoardNote() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id)
      if (error) throw error
      return id
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTES_QUERY_KEY })
    },
  })
}
