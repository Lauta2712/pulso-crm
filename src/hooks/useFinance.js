import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

function monthRange(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1)
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1)
  return { start: start.toISOString().slice(0, 10), end: end.toISOString().slice(0, 10) }
}

export function useInvoices(filters = {}) {
  return useQuery({
    queryKey: ['invoices', filters],
    queryFn: async () => {
      let query = supabase
        .from('invoices')
        .select('*, clients(id, name, company), projects(id, name)')
        .order('due_date', { ascending: true })

      if (filters.status) query = query.in('status', filters.status)
      if (filters.projectId) query = query.eq('project_id', filters.projectId)

      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}

export function useInvoice(id) {
  return useQuery({
    queryKey: ['invoices', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoices')
        .select('*, clients(id, name, company, email), projects(id, name), transactions(*)')
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
    enabled: !!id,
  })
}

export function useMarkInvoicePaid() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      const { data, error } = await supabase
        .from('invoices')
        .update({ status: 'paid', paid_date: new Date().toISOString().slice(0, 10) })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['finance-summary'] })
    },
  })
}

export function useTransactions(filters = {}) {
  return useQuery({
    queryKey: ['transactions', filters],
    queryFn: async () => {
      let query = supabase
        .from('transactions')
        .select('*, projects(id, name)')
        .order('date', { ascending: false })

      if (filters.projectId) query = query.eq('project_id', filters.projectId)
      if (filters.type) query = query.eq('type', filters.type)

      const { data, error } = await query
      if (error) throw error
      return data
    },
  })
}

export function useExpenses() {
  return useQuery({
    queryKey: ['expenses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('date', { ascending: false })
      if (error) throw error
      return data
    },
  })
}

export function useFinanceSummary() {
  return useQuery({
    queryKey: ['finance-summary'],
    queryFn: async () => {
      const { start, end } = monthRange()

      const [txRes, expRes, invRes] = await Promise.all([
        supabase.from('transactions').select('type, amount').gte('date', start).lt('date', end),
        supabase.from('expenses').select('amount').gte('date', start).lt('date', end),
        supabase.from('invoices').select('amount').in('status', ['sent', 'overdue']),
      ])

      if (txRes.error) throw txRes.error
      if (expRes.error) throw expRes.error
      if (invRes.error) throw invRes.error

      const income = txRes.data
        .filter((t) => t.type === 'income')
        .reduce((sum, t) => sum + Number(t.amount), 0)

      const txExpense = txRes.data
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + Number(t.amount), 0)

      const otherExpense = expRes.data.reduce((sum, e) => sum + Number(e.amount), 0)
      const expense = txExpense + otherExpense

      const receivable = invRes.data.reduce((sum, i) => sum + Number(i.amount), 0)

      return {
        income,
        expense,
        balance: income - expense,
        receivable,
      }
    },
  })
}
