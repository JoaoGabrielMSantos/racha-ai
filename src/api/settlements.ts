import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from './supabase'
import { groupKeys } from './groups'
import type { PixKeyType } from '@/lib/pix-key'

export const settlementKeys = {
  list: (groupId: string) => ['groups', groupId, 'settlements'] as const,
  pixKey: (groupId: string, creditor: string) => ['groups', groupId, 'pix', creditor] as const,
}

export type Settlement = {
  id: string
  fromUser: string
  toUser: string
  amountCents: number
  createdBy: string
  paidAt: string
}

export function useGroupSettlements(groupId: string) {
  return useQuery({
    queryKey: settlementKeys.list(groupId),
    queryFn: async (): Promise<Settlement[]> => {
      const { data, error } = await supabase
        .from('settlements')
        .select('id, from_user, to_user, amount_cents, created_by, paid_at')
        .eq('group_id', groupId)
        .order('paid_at', { ascending: false })
      if (error) throw error
      return data.map((s) => ({
        id: s.id,
        fromUser: s.from_user,
        toUser: s.to_user,
        amountCents: s.amount_cents,
        createdBy: s.created_by,
        paidAt: s.paid_at,
      }))
    },
  })
}

/** Quem pode desfazer um pagamento registrado (espelha a RLS de DELETE). */
export function canUndoSettlement(s: Pick<Settlement, 'createdBy' | 'fromUser' | 'toUser'>, meId: string): boolean {
  return s.createdBy === meId || s.fromUser === meId || s.toUser === meId
}

function invalidate(qc: ReturnType<typeof useQueryClient>, groupId: string) {
  void qc.invalidateQueries({ queryKey: settlementKeys.list(groupId) })
  void qc.invalidateQueries({ queryKey: groupKeys.summary })
  void qc.invalidateQueries({ queryKey: ['groups', groupId, 'pix'] })
}

/** "Marquei como pago" / "Já paguei" / "Recebi" / "Marcar como pago": todos criam um settlement. */
export function useCreateSettlement(groupId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (t: { from: string; to: string; amountCents: number; createdBy: string }) => {
      const { error } = await supabase.from('settlements').insert({
        group_id: groupId,
        from_user: t.from,
        to_user: t.to,
        amount_cents: t.amountCents,
        created_by: t.createdBy,
      })
      if (error) throw error
    },
    onSuccess: () => invalidate(qc, groupId),
  })
}

export function useDeleteSettlement(groupId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.from('settlements').delete().eq('id', id).select('id')
      if (error) throw error
      if (!data.length) throw Object.assign(new Error('sem permissão'), { code: '42501' })
    },
    onSuccess: () => invalidate(qc, groupId),
  })
}

export type CreditorPix =
  | { status: 'denied' }
  | { status: 'missing'; displayName: string | null }
  | { status: 'ok'; displayName: string | null; type: PixKeyType; key: string }

/**
 * Chave Pix do credor via RPC get_pix_key: só volta para quem deve a quem tem a receber.
 * 'denied' = o banco negou (saldo mudou); 'missing' = credor sem chave cadastrada.
 */
export function useCreditorPix(groupId: string, creditor: string | null) {
  return useQuery({
    queryKey: settlementKeys.pixKey(groupId, creditor ?? ''),
    enabled: !!creditor,
    queryFn: async (): Promise<CreditorPix> => {
      const { data, error } = await supabase.rpc('get_pix_key', { creditor: creditor!, gid: groupId })
      if (error) throw error
      if (!data || typeof data !== 'object' || Array.isArray(data)) return { status: 'denied' }
      const d = data as { display_name?: string | null; pix_key_type?: string | null; pix_key?: string | null }
      if (!d.pix_key || !d.pix_key_type) return { status: 'missing', displayName: d.display_name ?? null }
      return { status: 'ok', displayName: d.display_name ?? null, type: d.pix_key_type as PixKeyType, key: d.pix_key }
    },
  })
}
