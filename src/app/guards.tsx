import { useEffect, useRef } from 'react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/api/supabase'
import { friendlyError } from '@/api/errors'
import { useMyProfile } from '@/api/profile'
import { useAuth } from '@/auth/auth-context'
import { ScreenError, Splash } from '@/components/Splash'
import { useToast } from '@/components/toast-context'
import { clearPendingInvite, peekPendingInvite } from '@/lib/invite'

/** Exige sessão. Sem sessão → /login, lembrando de onde veio. */
export function RequireSession() {
  const { ready, session } = useAuth()
  const location = useLocation()
  if (!ready) return <Splash />
  if (!session) return <Navigate to="/login" replace state={{ from: location }} />
  return <Outlet />
}

/**
 * Exige perfil completo (display_name). Sem nome → /onboarding.
 * Com perfil ok, consome o convite pendente (se houver) e abre o grupo.
 */
export function RequireProfile() {
  const profile = useMyProfile()
  const location = useLocation()
  if (profile.isPending) return <Splash />
  if (profile.isError) return <ScreenError message={friendlyError(profile.error)} onRetry={() => profile.refetch()} />
  if (!profile.data.displayName) return <Navigate to="/onboarding" replace state={{ from: location }} />
  return (
    <>
      <PendingInviteHandler />
      <Outlet />
    </>
  )
}

function PendingInviteHandler() {
  const navigate = useNavigate()
  const toast = useToast()
  const qc = useQueryClient()
  const started = useRef(false)

  useEffect(() => {
    const code = peekPendingInvite()
    if (!code || started.current) return
    started.current = true
    void (async () => {
      const { data: groupId, error } = await supabase.rpc('join_group', { code })
      clearPendingInvite()
      if (error) {
        toast(error.code === 'P0002' ? 'Esse convite não vale mais' : friendlyError(error))
        return
      }
      await qc.invalidateQueries({ queryKey: ['groups'] })
      navigate(`/g/${groupId}`, { replace: true })
    })()
  }, [navigate, toast, qc])

  return null
}
