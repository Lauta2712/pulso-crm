import { create } from 'zustand'
import { supabase } from '../lib/supabase'

export const useAuthStore = create((set) => ({
  session: null,
  loading: true,

  init: () => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ session, loading: false })
    })

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session, loading: false })
    })
  },

  signOut: async () => {
    await supabase.auth.signOut()
    set({ session: null })
  },
}))
