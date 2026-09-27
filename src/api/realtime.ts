import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from './supabase'
import { groupKeys } from './groups'

/**
 * Atualiza a lista de membros ao vivo (Realtime em group_members, respeitando RLS).
 * O evento só invalida a query; quem renderiza decide o que animar/avisar.
 */
export function useGroupMembersRealtime(groupId: string) {
  const qc = useQueryClient()
  useEffect(() => {
    const channel = supabase
      .channel(`members:${groupId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'group_members', filter: `group_id=eq.${groupId}` },
        () => {
          void qc.invalidateQueries({ queryKey: groupKeys.members(groupId) })
          void qc.invalidateQueries({ queryKey: groupKeys.summary })
        },
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [groupId, qc])
}
