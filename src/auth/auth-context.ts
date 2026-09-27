import { createContext, useContext } from 'react'
import type { Session } from '@supabase/supabase-js'

export type AuthState = {
  /** false até o Supabase terminar de ler a sessão salva / o link mágico da URL. */
  ready: boolean
  session: Session | null
}

export const AuthContext = createContext<AuthState>({ ready: false, session: null })

export function useAuth(): AuthState {
  return useContext(AuthContext)
}

/** Sessão garantida (usar só dentro de rotas protegidas). */
export function useSession(): Session {
  const { session } = useAuth()
  if (!session) throw new Error('useSession fora de rota autenticada')
  return session
}
