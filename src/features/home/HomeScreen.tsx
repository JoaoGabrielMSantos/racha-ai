import { useNavigate } from 'react-router'
import { Plus } from 'lucide-react'
import { friendlyError } from '@/api/errors'
import { useMyGroups, type GroupSummary } from '@/api/groups'
import { useMyProfile } from '@/api/profile'
import { Avatar } from '@/components/Avatar'
import { Button } from '@/components/Button'
import { GroupCard } from '@/components/GroupCard'
import { EmptyState, FloatingBar, Screen, ScrollArea } from '@/components/Screen'
import { LoadingList, Skeleton } from '@/components/Skeleton'
import { TotalCard } from '@/components/TotalCard'
import { firstName } from '@/lib/names'
import { homeTotals } from '@/lib/totals'

export default function HomeScreen() {
  const navigate = useNavigate()
  const { data: me } = useMyProfile()
  const groups = useMyGroups()
  const name = me?.displayName ?? ''

  return (
    <Screen>
      <header className="flex flex-none items-center justify-between gap-3 px-5 pt-3 pb-2.5">
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="truncate text-sm font-semibold text-ink2">Oi, {firstName(name)}</div>
          <h1 className="m-0 text-[28px] font-extrabold tracking-[-0.035em] text-ink">Seus grupos</h1>
        </div>
        <Avatar name={name} hue={me?.avatarHue ?? 172} size="md" onClick={() => navigate('/perfil')} />
      </header>

      <ScrollArea reserve="bar" className="flex flex-col gap-3 pt-2">
        {groups.isPending ? (
          <>
            <div className="grid grid-cols-2 gap-2.5">
              <Skeleton className="h-[78px] rounded-3xl" />
              <Skeleton className="h-[78px] rounded-3xl" />
            </div>
            <LoadingList count={3} tile="emoji" />
          </>
        ) : groups.isError ? (
          <EmptyState
            icon="😵"
            title="Não deu pra carregar"
            text={friendlyError(groups.error)}
            action={
              <Button size="md" full={false} className="h-[52px] rounded-[18px] px-[22px]" onClick={() => groups.refetch()}>
                Tentar de novo
              </Button>
            }
          />
        ) : groups.data.length === 0 ? (
          <EmptyState
            icon="🎒"
            title="Nenhum grupo ainda"
            text="Cria um grupo pra viagem, a rep ou o rolê e chama a galera pelo link."
          />
        ) : (
          <GroupList groups={groups.data} onOpen={(id) => navigate(`/g/${id}`)} />
        )}
      </ScrollArea>

      <FloatingBar>
        <Button
          icon={<Plus size={20} strokeWidth={2.6} />}
          className="shadow-brand"
          onClick={() => navigate('/novo-grupo')}
        >
          Novo grupo
        </Button>
      </FloatingBar>
    </Screen>
  )
}

function GroupList({ groups, onOpen }: { groups: GroupSummary[]; onOpen: (id: string) => void }) {
  const { receive, pay } = homeTotals(groups)
  return (
    <>
      <div className="grid grid-cols-2 gap-2.5">
        <TotalCard kind="receive" cents={receive} />
        <TotalCard kind="pay" cents={pay} />
      </div>
      {groups.map((g) => (
        <GroupCard
          key={g.id}
          name={g.name}
          emoji={g.emoji}
          memberCount={g.memberCount}
          expenseCount={g.expenseCount}
          balance={g.myBalanceCents}
          onClick={() => onOpen(g.id)}
        />
      ))}
    </>
  )
}
