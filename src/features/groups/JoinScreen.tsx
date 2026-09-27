import { useEffect, useRef } from 'react'
import { Navigate, Outlet, useLocation, useNavigate, useParams } from 'react-router'
import { friendlyError } from '@/api/errors'
import { useJoinGroup } from '@/api/groups'
import { useAuth } from '@/auth/auth-context'
import { Button } from '@/components/Button'
import { EmptyState, Screen, ScrollArea } from '@/components/Screen'
import { Splash } from '@/components/Splash'
import { clearPendingInvite, savePendingInvite } from '@/lib/invite'

/**
 * /c/:code sem sessão: guarda o code (sessionStorage) e manda para /login.
 * O login volta para cá (mesma aba via state; link mágico via emailRedirectTo).
 */
export function InviteGate() {
  const { ready, session } = useAuth()
  const { code = '' } = useParams()
  const location = useLocation()
  if (!ready) return <Splash />
  if (!session) {
    savePendingInvite(code)
    return <Navigate to="/login" replace state={{ from: location }} />
  }
  return <Outlet />
}

/** Com sessão e perfil completo: entra no grupo (idempotente) e abre. */
export default function JoinScreen() {
  const { code = '' } = useParams()
  const navigate = useNavigate()
  const join = useJoinGroup()
  const started = useRef(false)

  useEffect(() => {
    if (started.current) return
    started.current = true
    join.mutate(code, {
      onSuccess: (groupId) => navigate(`/g/${groupId}`, { replace: true }),
      onSettled: () => clearPendingInvite(),
    })
  }, [code, join, navigate])

  if (!join.isError) return <Splash />

  const invalid = (join.error as { code?: string }).code === 'P0002'
  return (
    <Screen>
      <ScrollArea className="flex flex-col justify-center">
        <EmptyState
          icon="🔗"
          title={invalid ? 'Convite inválido' : 'Não deu pra entrar'}
          text={invalid ? 'Esse link não funciona mais. Pede um novo pra quem te convidou.' : friendlyError(join.error)}
          action={
            <Button size="md" full={false} className="h-[52px] rounded-[18px] px-[22px]" onClick={() => navigate('/', { replace: true })}>
              Ir pros meus grupos
            </Button>
          }
        />
      </ScrollArea>
    </Screen>
  )
}
