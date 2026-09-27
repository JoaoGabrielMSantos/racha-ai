import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from './supabase'
import { useSession } from '@/auth/auth-context'
import type { PixKeyType } from '@/lib/pix-key'

export type MyProfile = {
  id: string
  displayName: string | null
  avatarHue: number
  pixKeyType: PixKeyType | null
  pixKey: string | null
}

export const profileKeys = {
  me: ['me', 'profile'] as const,
}

/** Perfil do próprio usuário, com a chave Pix (via RPC; a coluna não é legível por SELECT). */
export function useMyProfile() {
  const session = useSession()
  return useQuery({
    queryKey: [...profileKeys.me, session.user.id],
    queryFn: async (): Promise<MyProfile> => {
      const { data, error } = await supabase.rpc('get_my_profile').single()
      if (error) throw error
      return {
        id: data.id,
        displayName: data.display_name || null,
        avatarHue: data.avatar_hue,
        pixKeyType: (data.pix_key_type as PixKeyType | null) ?? null,
        pixKey: data.pix_key ?? null,
      }
    },
  })
}

export type ProfileUpdate = {
  displayName: string
  pixKeyType: PixKeyType | null
  /** Já normalizada; null remove a chave. */
  pixKey: string | null
}

export function useUpdateProfile() {
  const session = useSession()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (u: ProfileUpdate) => {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: u.displayName,
          pix_key_type: u.pixKey ? u.pixKeyType : null,
          pix_key: u.pixKey,
        })
        .eq('id', session.user.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: profileKeys.me }),
  })
}
