import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from './supabase'
import { groupKeys } from './groups'
import type { Json } from './database.types'
import type { SaveExpensePayload, SplitMode } from '@/lib/expense-draft'

export const expenseKeys = {
  list: (groupId: string) => ['groups', groupId, 'expenses'] as const,
}

export type Expense = {
  id: string
  groupId: string
  description: string
  amountCents: number
  paidBy: string
  splitMode: SplitMode
  expenseDate: string
  createdBy: string
  createdAt: string
  splits: { userId: string; amountCents: number }[]
}

/** Gastos do grupo com as partes (uma query com embed). */
export function useGroupExpenses(groupId: string) {
  return useQuery({
    queryKey: expenseKeys.list(groupId),
    queryFn: async (): Promise<Expense[]> => {
      const { data, error } = await supabase
        .from('expenses')
        .select(
          'id, group_id, description, amount_cents, paid_by, split_mode, expense_date, created_by, created_at, splits:expense_splits(user_id, amount_cents)',
        )
        .eq('group_id', groupId)
        .order('expense_date', { ascending: false })
        .order('created_at', { ascending: false })
      if (error) throw error
      return data.map((e) => ({
        id: e.id,
        groupId: e.group_id,
        description: e.description,
        amountCents: e.amount_cents,
        paidBy: e.paid_by,
        splitMode: e.split_mode as SplitMode,
        expenseDate: e.expense_date,
        createdBy: e.created_by,
        createdAt: e.created_at,
        splits: e.splits.map((s) => ({ userId: s.user_id, amountCents: s.amount_cents })),
      }))
    },
  })
}

/** Só quem criou ou quem pagou pode editar/excluir (espelha a RLS). */
export function canEditExpense(e: Pick<Expense, 'createdBy' | 'paidBy'>, meId: string): boolean {
  return e.createdBy === meId || e.paidBy === meId
}

function invalidateGroupMoney(qc: ReturnType<typeof useQueryClient>, groupId: string) {
  void qc.invalidateQueries({ queryKey: expenseKeys.list(groupId) })
  void qc.invalidateQueries({ queryKey: groupKeys.summary })
}

/** Cria ou edita (RPC save_expense: gasto + partes numa transação). */
export function useSaveExpense(groupId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (payload: SaveExpensePayload) => {
      const { data, error } = await supabase.rpc('save_expense', { payload: payload as unknown as Json })
      if (error) throw error
      return data
    },
    onSuccess: () => invalidateGroupMoney(qc, groupId),
  })
}

export function useDeleteExpense(groupId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (expenseId: string) => {
      // .select() devolve as linhas apagadas: RLS que barra o delete não dá erro, só apaga 0.
      const { data, error } = await supabase.from('expenses').delete().eq('id', expenseId).select('id')
      if (error) throw error
      if (!data.length) throw Object.assign(new Error('sem permissão'), { code: '42501' })
    },
    onSuccess: () => invalidateGroupMoney(qc, groupId),
  })
}
