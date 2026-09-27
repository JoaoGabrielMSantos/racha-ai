import { useEffect } from 'react'
import { useQueryClient, type QueryClient } from '@tanstack/react-query'
import { supabase } from './supabase'
import { groupKeys } from './groups'
import { expenseKeys, type Expense } from './expenses'
import { settlementKeys, type Settlement } from './settlements'

/**
 * Realtime (postgres_changes, respeitando RLS). Os eventos só invalidam queries do
 * TanStack Query; a tela recarrega os dados já com as regras de acesso aplicadas.
 *
 * Limitações do Supabase Realtime tratadas aqui:
 * - eventos DELETE não aceitam filtro e só trazem a chave primária → conferimos o id no cache;
 * - expense_splits não tem group_id → conferimos o expense_id no cache do grupo.
 */

/** Junta rajadas de eventos (um save gera 1 evento no gasto + N nas partes) numa invalidação. */
function debounced(fn: () => void, ms = 150) {
  let t: number | undefined
  const run = () => {
    window.clearTimeout(t)
    t = window.setTimeout(fn, ms)
  }
  run.cancel = () => window.clearTimeout(t)
  return run
}

function cachedIds<T extends { id: string }>(qc: QueryClient, key: readonly unknown[]): Set<string> {
  return new Set((qc.getQueryData<T[]>(key) ?? []).map((x) => x.id))
}

/** Lista de membros ao vivo (tela de convite). */
export function useGroupMembersRealtime(groupId: string) {
  const qc = useQueryClient()
  useEffect(() => {
    const refresh = debounced(() => {
      void qc.invalidateQueries({ queryKey: groupKeys.members(groupId) })
      void qc.invalidateQueries({ queryKey: groupKeys.summary })
    })
    const channel = supabase
      .channel(`members:${groupId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_members', filter: `group_id=eq.${groupId}` }, refresh)
      .subscribe()
    return () => {
      refresh.cancel()
      void supabase.removeChannel(channel)
    }
  }, [groupId, qc])
}

/** Tela do grupo: membros, gastos, partes e pagamentos ao vivo. */
export function useGroupRealtime(groupId: string) {
  const qc = useQueryClient()
  useEffect(() => {
    const refreshMembers = debounced(() => {
      void qc.invalidateQueries({ queryKey: groupKeys.members(groupId) })
    })
    const refreshExpenses = debounced(() => {
      void qc.invalidateQueries({ queryKey: expenseKeys.list(groupId) })
      void qc.invalidateQueries({ queryKey: groupKeys.summary })
    })
    const refreshSettlements = debounced(() => {
      void qc.invalidateQueries({ queryKey: settlementKeys.list(groupId) })
      void qc.invalidateQueries({ queryKey: ['groups', groupId, 'pix'] })
      void qc.invalidateQueries({ queryKey: groupKeys.summary })
    })
    const byGroup = `group_id=eq.${groupId}`

    const channel = supabase
      .channel(`group:${groupId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_members', filter: byGroup }, refreshMembers)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'expenses', filter: byGroup }, refreshExpenses)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'expenses', filter: byGroup }, refreshExpenses)
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'expenses' }, (p) => {
        const id = (p.old as { id?: string }).id
        if (id && cachedIds<Expense>(qc, expenseKeys.list(groupId)).has(id)) refreshExpenses()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expense_splits' }, (p) => {
        const row = (p.new && 'expense_id' in p.new ? p.new : p.old) as { expense_id?: string }
        if (row.expense_id && cachedIds<Expense>(qc, expenseKeys.list(groupId)).has(row.expense_id)) refreshExpenses()
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'settlements', filter: byGroup }, refreshSettlements)
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'settlements' }, (p) => {
        const id = (p.old as { id?: string }).id
        if (id && cachedIds<Settlement>(qc, settlementKeys.list(groupId)).has(id)) refreshSettlements()
      })
      .subscribe()

    return () => {
      refreshMembers.cancel()
      refreshExpenses.cancel()
      refreshSettlements.cancel()
      void supabase.removeChannel(channel)
    }
  }, [groupId, qc])
}

/** Home: qualquer mudança de dinheiro nos meus grupos atualiza cards e totais. */
export function useHomeRealtime() {
  const qc = useQueryClient()
  useEffect(() => {
    const refresh = debounced(() => void qc.invalidateQueries({ queryKey: groupKeys.summary }), 300)
    // Sem filtro: a RLS já limita INSERT/UPDATE aos meus grupos. DELETE chega de todos
    // (só com a PK), então um refresh a mais aqui é aceitável — é uma chamada leve.
    const channel = supabase
      .channel('home')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'settlements' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'group_members' }, refresh)
      .subscribe()
    return () => {
      refresh.cancel()
      void supabase.removeChannel(channel)
    }
  }, [qc])
}
