import { useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Copy, Share, X } from 'lucide-react'
import { friendlyError } from '@/api/errors'
import { inviteUrl, useGroup, useGroupMembers, type Member } from '@/api/groups'
import { useGroupMembersRealtime } from '@/api/realtime'
import { useSession } from '@/auth/auth-context'
import { Avatar } from '@/components/Avatar'
import { Button } from '@/components/Button'
import { IconButton } from '@/components/IconButton'
import { EmptyState, FooterBar, Screen, ScreenHeader, ScrollArea } from '@/components/Screen'
import { Skeleton } from '@/components/Skeleton'
import { useToast } from '@/components/toast-context'
import { fullName, shortName } from '@/lib/names'
import { copyText, openWhatsApp } from '@/lib/share'

export default function InviteScreen() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const group = useGroup(id)
  const toGroup = () => navigate(`/g/${id}`, { replace: true })

  return (
    <Screen>
      <ScreenHeader className="justify-end">
        <IconButton label="Fechar" onClick={toGroup}>
          <X size={18} strokeWidth={2.4} />
        </IconButton>
      </ScreenHeader>
      {group.isPending ? (
        <InviteSkeleton />
      ) : group.isError || !group.data ? (
        <ScrollArea>
          <EmptyState
            icon="🔍"
            title="Grupo não encontrado"
            text={group.isError ? friendlyError(group.error) : 'Ele não existe mais ou você não participa dele.'}
            action={
              <Button size="md" full={false} className="h-[52px] rounded-[18px] px-[22px]" onClick={() => navigate('/')}>
                Ir pros meus grupos
              </Button>
            }
          />
        </ScrollArea>
      ) : (
        <InviteBody groupId={id} name={group.data.name} emoji={group.data.emoji} code={group.data.inviteCode} />
      )}
      <FooterBar bordered={false}>
        <Button variant="secondary" className="h-[54px] text-[15px]" onClick={toGroup}>
          Ir para o grupo
        </Button>
      </FooterBar>
    </Screen>
  )
}

function InviteBody({ groupId, name, emoji, code }: { groupId: string; name: string; emoji: string; code: string }) {
  const toast = useToast()
  const url = inviteUrl(code)
  const display = url.replace(/^https?:\/\//, '')

  return (
    <ScrollArea className="flex flex-col items-center gap-5 pt-1 pb-5">
      <div className="flex size-24 flex-none items-center justify-center rounded-[32px] bg-surface text-[50px] shadow-card" aria-hidden="true">
        {emoji}
      </div>
      <div className="flex flex-col gap-2 text-center">
        <h1 className="m-0 text-[26px] font-extrabold tracking-[-0.035em] text-balance text-ink">Agora chama a galera</h1>
        <p className="m-0 text-[15px] leading-normal text-pretty text-ink2">
          Quem entrar pelo link já participa dos gastos de <b className="text-ink">{name}</b>.
        </p>
      </div>

      <div className="flex w-full flex-none items-center gap-2.5 rounded-[22px] bg-surface py-2 pr-2 pl-[18px] shadow-card">
        <div className="min-w-0 flex-1 truncate font-mono text-[15px] font-bold text-ink" title={url}>
          {display}
        </div>
        <Button
          variant="secondary"
          size="sm"
          full={false}
          className="h-11 rounded-[14px] border-0 bg-surface2 px-3.5"
          icon={<Copy size={16} strokeWidth={2.2} />}
          onClick={async () => {
            await copyText(url)
            toast('Link copiado')
          }}
        >
          Copiar
        </Button>
      </div>

      <Button
        variant="whatsapp"
        icon={<Share size={20} strokeWidth={2.2} />}
        onClick={() => openWhatsApp(`Bora rachar os gastos de "${name}" no Racha Aí? Entra aqui: ${url}`)}
      >
        Compartilhar no WhatsApp
      </Button>

      <JoinedList groupId={groupId} />
    </ScrollArea>
  )
}

/** "Já entraram · n": atualiza ao vivo e anima quem acabou de entrar. */
function JoinedList({ groupId }: { groupId: string }) {
  const session = useSession()
  const toast = useToast()
  const members = useGroupMembers(groupId)
  useGroupMembersRealtime(groupId)

  // Avisa quem entrou depois que a tela abriu (não na primeira carga).
  const known = useRef<Set<string> | null>(null)
  useEffect(() => {
    if (!members.data) return
    const ids = new Set(members.data.map((m) => m.id))
    if (known.current) {
      for (const m of members.data) {
        if (!known.current.has(m.id) && m.id !== session.user.id) toast(`${shortName(m, session.user.id)} entrou no grupo`)
      }
    }
    known.current = ids
  }, [members.data, session.user.id, toast])

  if (members.isPending) {
    return (
      <div className="flex w-full flex-col gap-3">
        <Skeleton className="h-4 w-28" />
        <div className="flex gap-3.5">
          <Skeleton className="size-[52px] rounded-full" />
          <Skeleton className="size-[52px] rounded-full" />
        </div>
      </div>
    )
  }
  if (members.isError) return <p className="m-0 w-full text-[13px] font-bold text-neg">{friendlyError(members.error)}</p>

  const list: Member[] = members.data
  return (
    <section className="mt-1.5 flex w-full flex-col gap-3" aria-live="polite">
      <h2 className="m-0 text-[13px] font-bold text-ink2">
        {list.length === 1 ? 'Por enquanto, só você' : `Já entraram · ${list.length}`}
      </h2>
      <ul className="m-0 flex list-none flex-wrap gap-3.5 p-0">
        {list.map((m) => (
          <li key={m.id} className="flex animate-ra-in-slow flex-col items-center gap-1.5">
            <Avatar name={fullName(m)} hue={m.avatarHue} size="lg" />
            <div className="max-w-[64px] truncate text-xs font-semibold text-ink2">{shortName(m, session.user.id)}</div>
          </li>
        ))}
      </ul>
    </section>
  )
}

function InviteSkeleton() {
  return (
    <div className="flex flex-1 flex-col items-center gap-5 px-5 pt-1" aria-busy="true" aria-label="Carregando convite">
      <Skeleton className="size-24 rounded-[32px]" />
      <Skeleton className="h-7 w-56" />
      <Skeleton className="h-4 w-64" />
      <Skeleton className="h-[60px] w-full rounded-[22px]" />
      <Skeleton className="h-[58px] w-full rounded-[20px]" />
    </div>
  )
}
