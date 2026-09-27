import { useMemo, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router'
import { ChevronLeft, Ellipsis, Plus } from 'lucide-react'
import { friendlyError } from '@/api/errors'
import { useGroup, useGroupMembers } from '@/api/groups'
import { useGroupMembersRealtime } from '@/api/realtime'
import { useGroupExpenses } from '@/api/expenses'
import { ExpensesTab } from '@/features/expenses/ExpensesTab'
import { formatBRL } from '@/lib/money'
import { Avatar } from '@/components/Avatar'
import { Button } from '@/components/Button'
import { IconButton } from '@/components/IconButton'
import { EmptyState, Screen, ScreenHeader, ScrollArea } from '@/components/Screen'
import { SegmentedTabs } from '@/components/SegmentedTabs'
import { Skeleton } from '@/components/Skeleton'
import { fullName } from '@/lib/names'
import { plural } from '@/lib/format'
import { GroupMenuSheet } from './GroupMenuSheet'

export type GroupTab = 'gastos' | 'saldos' | 'acertos'
const TABS: GroupTab[] = ['gastos', 'saldos', 'acertos']

export default function GroupScreen() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const tab: GroupTab = TABS.includes(params.get('tab') as GroupTab) ? (params.get('tab') as GroupTab) : 'gastos'
  const group = useGroup(id)
  const members = useGroupMembers(id)
  const expenses = useGroupExpenses(id)
  const memberMap = useMemo(() => new Map((members.data ?? []).map((m) => [m.id, m])), [members.data])
  const total = (expenses.data ?? []).reduce((a, e) => a + e.amountCents, 0)
  const [menu, setMenu] = useState(false)
  useGroupMembersRealtime(id)

  const setTab = (t: GroupTab) => setParams(t === 'gastos' ? {} : { tab: t }, { replace: true })

  return (
    <Screen>
      <ScreenHeader className="gap-2.5">
        <IconButton label="Voltar" onClick={() => navigate('/')}>
          <ChevronLeft size={20} strokeWidth={2.4} />
        </IconButton>
        <div className="flex-1" />
        <div className="flex pr-2" aria-hidden="true">
          {(members.data ?? []).slice(0, 4).map((m) => (
            <div key={m.id} className="-mr-2">
              <Avatar name={fullName(m)} hue={m.avatarHue} size="sm" />
            </div>
          ))}
        </div>
        <Button
          variant="secondary"
          size="sm"
          full={false}
          className="ml-1.5 h-10 rounded-full border-0 bg-surface px-3.5 text-[13px] shadow-card"
          icon={<Plus size={14} strokeWidth={2.8} />}
          onClick={() => navigate(`/g/${id}/convite`)}
        >
          Convidar
        </Button>
        <IconButton label="Mais opções" className="size-10" onClick={() => setMenu(true)} disabled={!group.data}>
          <Ellipsis size={18} strokeWidth={2.4} />
        </IconButton>
      </ScreenHeader>

      <ScrollArea reserve="fab" className="flex flex-col gap-4 pt-2.5">
        {group.isPending ? (
          <div className="flex items-center gap-3.5">
            <Skeleton className="size-14 rounded-[19px]" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-6 w-3/5" />
              <Skeleton className="h-3.5 w-2/5" />
            </div>
          </div>
        ) : group.isError || !group.data ? (
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
        ) : (
          <>
            <div className="flex items-center gap-3.5">
              <div className="flex size-14 flex-none items-center justify-center rounded-[19px] bg-surface text-[30px] shadow-card" aria-hidden="true">
                {group.data.emoji}
              </div>
              <div className="flex min-w-0 flex-col gap-0.5">
                <h1 className="m-0 line-clamp-2 text-2xl leading-[1.15] font-extrabold tracking-[-0.035em] break-words text-ink">
                  {group.data.name}
                </h1>
                <div className="text-[13px] text-ink2">
                  {members.data ? `${plural(members.data.length, 'membro', 'membros')} · total ${formatBRL(total)}` : ' '}
                </div>
              </div>
            </div>
            <SegmentedTabs
              label="Seções do grupo"
              value={tab}
              onChange={setTab}
              tabs={[
                { key: 'gastos', label: 'Gastos' },
                { key: 'saldos', label: 'Saldos' },
                { key: 'acertos', label: 'Acertos' },
              ]}
            />
            {tab === 'gastos' ? (
              <ExpensesTab groupId={id} expenses={expenses} members={memberMap} />
            ) : (
              <EmptyState icon="🚧" title="Em construção" text="Saldos e acertos chegam na etapa 7." />
            )}
            <GroupMenuSheet open={menu} onClose={() => setMenu(false)} groupId={id} groupName={group.data.name} />
          </>
        )}
      </ScrollArea>
    </Screen>
  )
}
