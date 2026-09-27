import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { Plus } from 'lucide-react'
import { friendlyError } from '@/api/errors'
import type { Expense } from '@/api/expenses'
import type { Member } from '@/api/groups'
import { useSession } from '@/auth/auth-context'
import { Button } from '@/components/Button'
import { ExpenseCard } from '@/components/ExpenseCard'
import { EmptyState } from '@/components/Screen'
import { LoadingList } from '@/components/Skeleton'
import { groupByDay } from '@/lib/dates'
import { fullName, shortName } from '@/lib/names'
import { ExpenseDetailSheet } from './ExpenseDetailSheet'

type Props = {
  groupId: string
  expenses: { data?: Expense[]; isPending: boolean; error: unknown; refetch: () => unknown }
  members: Map<string, Member>
}

/** Aba Gastos: lista agrupada por dia (correção 3), FAB e detalhe em bottom sheet. */
export function ExpensesTab({ groupId, expenses, members }: Props) {
  const navigate = useNavigate()
  const session = useSession()
  const meId = session.user.id
  const [openId, setOpenId] = useState<string | null>(null)
  const newExpense = () => navigate(`/g/${groupId}/novo-gasto`)

  const days = useMemo(
    () => groupByDay((expenses.data ?? []).map((e) => ({ ...e, expense_date: e.expenseDate, created_at: e.createdAt }))),
    [expenses.data],
  )
  const open = expenses.data?.find((e) => e.id === openId) ?? null

  if (expenses.isPending) return <LoadingList count={4} />
  if (expenses.error) {
    return (
      <EmptyState
        icon="😵"
        title="Não deu pra carregar"
        text={friendlyError(expenses.error)}
        action={
          <Button size="md" full={false} className="h-[52px] rounded-[18px] px-[22px]" onClick={() => expenses.refetch()}>
            Tentar de novo
          </Button>
        }
      />
    )
  }
  if (!days.length) {
    return (
      <EmptyState
        icon="🧾"
        title="Nenhum gasto ainda"
        text="Pagou alguma coisa pra galera? Registra aqui que o Racha Aí faz as contas."
        action={
          <Button size="md" full={false} className="h-[52px] rounded-[18px] px-[22px]" onClick={newExpense}>
            Adicionar primeiro gasto
          </Button>
        }
      />
    )
  }

  return (
    <>
      <div className="flex flex-col gap-4">
        {days.map((day) => (
          <section key={day.date} className="flex flex-col gap-2.5" aria-label={day.label}>
            <h2 className="m-0 px-1 text-[13px] font-bold text-ink2">{day.label}</h2>
            {day.items.map((e) => {
              const payer = members.get(e.paidBy)
              return (
                <ExpenseCard
                  key={e.id}
                  description={e.description}
                  payerName={fullName(payer)}
                  payerShort={shortName(payer ?? { id: e.paidBy, displayName: null, avatarHue: 0 }, meId)}
                  hue={payer?.avatarHue ?? 170}
                  amount={e.amountCents}
                  myShare={e.splits.find((s) => s.userId === meId)?.amountCents ?? 0}
                  iPaid={e.paidBy === meId}
                  onClick={() => setOpenId(e.id)}
                />
              )
            })}
          </section>
        ))}
      </div>

      <button
        type="button"
        onClick={newExpense}
        aria-label="Novo gasto"
        className="absolute right-5 bottom-[calc(26px+env(safe-area-inset-bottom))] z-10 flex size-16 items-center justify-center rounded-[22px] bg-brand text-on-brand shadow-fab transition-transform duration-150 active:scale-[.94]"
      >
        <Plus size={28} strokeWidth={2.6} />
      </button>

      <ExpenseDetailSheet expense={open} members={members} groupId={groupId} onClose={() => setOpenId(null)} />
    </>
  )
}
