import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from './supabase'
import type { Person } from '@/lib/names'

export const groupKeys = {
  all: ['groups'] as const,
  summary: ['groups', 'summary'] as const,
  detail: (id: string) => ['groups', id] as const,
  members: (id: string) => ['groups', id, 'members'] as const,
}

export type GroupSummary = {
  id: string
  name: string
  emoji: string
  memberCount: number
  expenseCount: number
  totalCents: number
  myBalanceCents: number
}

/** Home: todos os grupos + contadores + meu saldo, numa chamada (RPC my_groups_summary). */
export function useMyGroups() {
  return useQuery({
    queryKey: groupKeys.summary,
    queryFn: async (): Promise<GroupSummary[]> => {
      const { data, error } = await supabase.rpc('my_groups_summary')
      if (error) throw error
      return data.map((g) => ({
        id: g.id,
        name: g.name,
        emoji: g.emoji,
        memberCount: g.member_count,
        expenseCount: g.expense_count,
        totalCents: Number(g.total_cents),
        myBalanceCents: Number(g.my_balance_cents),
      }))
    },
  })
}

export type Group = { id: string; name: string; emoji: string; inviteCode: string; createdBy: string }

export function useGroup(id: string) {
  return useQuery({
    queryKey: groupKeys.detail(id),
    queryFn: async (): Promise<Group | null> => {
      const { data, error } = await supabase
        .from('groups')
        .select('id, name, emoji, invite_code, created_by')
        .eq('id', id)
        .maybeSingle()
      if (error) throw error
      // null = não existe ou não sou membro (RLS esconde)
      return data && { id: data.id, name: data.name, emoji: data.emoji, inviteCode: data.invite_code, createdBy: data.created_by }
    },
  })
}

export type Member = Person & { joinedAt: string }

/** Membros atuais, na ordem de entrada. */
export function useGroupMembers(groupId: string) {
  return useQuery({
    queryKey: groupKeys.members(groupId),
    queryFn: async (): Promise<Member[]> => {
      const { data, error } = await supabase
        .from('group_members')
        .select('user_id, joined_at, profile:profiles(id, display_name, avatar_hue)')
        .eq('group_id', groupId)
        .order('joined_at')
      if (error) throw error
      return data.map((m) => ({
        id: m.user_id,
        joinedAt: m.joined_at,
        displayName: m.profile?.display_name ?? null,
        avatarHue: m.profile?.avatar_hue ?? 170,
      }))
    },
  })
}

export const GROUP_EMOJIS = ['🏖️', '🏠', '🍻', '🎂', '✈️', '🔥', '⛺', '🎉', '🍕', '🚗', '⚽', '🛒'] as const

export function useCreateGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ name, emoji }: { name: string; emoji: string }) => {
      // O id é gerado aqui e o insert não pede RETURNING: a policy de SELECT exige
      // ser membro, e a membership só é criada pelo trigger depois do insert.
      const id = crypto.randomUUID()
      const { error } = await supabase.from('groups').insert({ id, name: name.trim(), emoji })
      if (error) throw error
      return id
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: groupKeys.summary }),
  })
}

export function useJoinGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (code: string) => {
      const { data, error } = await supabase.rpc('join_group', { code })
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: groupKeys.all }),
  })
}

export function useLeaveGroup() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (gid: string) => {
      const { error } = await supabase.rpc('leave_group', { gid })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: groupKeys.all }),
  })
}

export function inviteUrl(code: string, origin = window.location.origin): string {
  return `${origin}/c/${code}`
}
