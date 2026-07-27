import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

const CV_BUCKET = 'cvs'

export function useCandidates() {
  return useQuery({
    queryKey: ['candidates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('candidates')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export async function getCandidateCvUrl(cvPath) {
  const { data, error } = await supabase.storage.from(CV_BUCKET).createSignedUrl(cvPath, 60)
  if (error) throw error
  return data.signedUrl
}

async function uploadCv(file) {
  const ext = file.name.split('.').pop()
  const path = `${crypto.randomUUID()}.${ext}`
  const { error } = await supabase.storage.from(CV_BUCKET).upload(path, file)
  if (error) throw error
  return path
}

export function useCreateCandidate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ cvFile, ...candidate }) => {
      const payload = { ...candidate }
      if (cvFile) {
        payload.cv_path = await uploadCv(cvFile)
        payload.cv_filename = cvFile.name
      }
      const { data, error } = await supabase.from('candidates').insert(payload).select().single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
    },
  })
}

export function useUpdateCandidate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, cvFile, ...updates }) => {
      if (cvFile) {
        updates.cv_path = await uploadCv(cvFile)
        updates.cv_filename = cvFile.name
      }
      const { data, error } = await supabase
        .from('candidates')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
    },
  })
}

export function useDeleteCandidate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (candidate) => {
      const { error } = await supabase.from('candidates').delete().eq('id', candidate.id)
      if (error) throw error
      if (candidate.cv_path) {
        await supabase.storage.from(CV_BUCKET).remove([candidate.cv_path])
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
    },
  })
}
