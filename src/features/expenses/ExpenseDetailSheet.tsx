import { useState } from 'react'
import { useNavigate } from 'react-router'
import { Pencil, Trash2 } from 'lucide-react'
import { friendlyError } from '@/api/errors'
import { canEditExpense, useDeleteExpense, type Expense } from '@/api/expenses'
import type { Member } from '@/api/groups'
import { useSession } from '@/auth/auth-context'
import { Avatar } from '@/components/Avatar'
import { BottomSheet } from '@/components/BottomSheet'
import { Button } from '@/components/Button'
import { FieldError } from '@/components/Input'
import { useToast } from '@/components/toast-context'
import { dayLabel } from '@/lib/dates'
import { formatBRL } from '@/lib/money'
import { fullName, shortName } from '@/lib/names'
import { cn } from '@/lib/cn'

const MODE_LABEL = { equal: 'Igual pra todos', amount: 'Por valor', some: 'Só alguns' } as const

type Props = {
  expense: Expense | null
  members: Map<string, Member>
  groupId: string
  onClose: () => void
}

/** Detalhe do gasto: valor, quem pagou, data, partes; Editar/Excluir para quem criou ou pagou. */
export function ExpenseDetailSheet({ expense, members, groupId, onClose }: Props) {
  // Mantém o último gasto para a animação de saída do sheet
  const [shown, setShown] = useState<Expense | null>(expense)
  if (expense && expense !== shown) setShown(expense)

  return (
    <BottomSheet open={!!expense} title={shown?.description ?? ''} onClose={onClose}>
      {shown && <DetailBody key={shown.id} expense={shown} members={members} groupId={groupId} onClose={onClose} />}
    </BottomSheet>
  )
}

function DetailBody({ expense: e, members, groupId, onClose }: Required<Omit<Props, 'expense'>> & { expense: Expense }) {
  const session = useSession()
  const navigate = useNavigate()
  const toast = useToast()
  const del = useDeleteExpense(groupId)
  const [confirming, setConfirming] = useState(false)
  const meId = session.user.id
  const payer = members.get(e.paidBy)
  const canEdit = canEditExpense(e, meId)
  const parts = [...e.splits].sort((a, b) => b.amountCents - a.amountCents)

  return (
    <>
      <div className="flex flex-col items-center gap-1.5">
        <div className="tabular text-[40px] font-extrabold tracking-[-0.045em] text-ink">{formatBRL(e.amountCents)}</div>
        <div className="flex items-center gap-2 text-sm text-ink2">
          <Avatar name={fullName(payer)} hue={payer?.avatarHue ?? 170} size="sm" />
          <span>
            <b className="text-ink">{shortName(payer ?? { id: e.paidBy, displayName: null, avatarHue: 0 }, meId)}</b> pagou ·{' '}
            {dayLabel(e.expenseDate)}
          </span>
        </div>
      </div>

      <section aria-label="Partes de cada um" className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between px-1">
          <h3 className="m-0 text-[13px] font-bold text-ink2">Quem participa</h3>
          <span className="text-xs font-semibold text-ink2">{MODE_LABEL[e.splitMode]}</span>
        </div>
        <ul className="m-0 list-none rounded-[22px] bg-surface2 px-3.5 py-1">
          {parts.map((s, i) => {
            const m = members.get(s.userId)
            const me = s.userId === meId
            return (
              <li key={s.userId} className={cn('flex min-h-12 items-center gap-3 py-2', i > 0 && 'border-t border-line')}>
                <Avatar name={fullName(m)} hue={m?.avatarHue ?? 170} size="sm" />
                <span className={cn('min-w-0 flex-1 truncate text-[15px] text-ink', me ? 'font-extrabold' : 'font-semibold')}>
                  {me ? 'Você' : fullName(m)}
                </span>
                <span className="tabular text-[15px] font-bold text-ink">{formatBRL(s.amountCents)}</span>
              </li>
            )
          })}
        </ul>
      </section>

      {canEdit ? (
        confirming ? (
          <div className="flex flex-col gap-2.5 rounded-[22px] bg-neg-bg p-4" role="alertdialog" aria-label="Confirmar exclusão">
            <div className="text-[15px] font-bold text-ink">Excluir esse gasto?</div>
            <p className="m-0 text-[13px] leading-[1.45] text-ink2">Os saldos de todo mundo são recalculados na hora.</p>
            <FieldError>{del.isError ? friendlyError(del.error) : null}</FieldError>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" full={false} className="flex-1" onClick={() => setConfirming(false)}>
                Cancelar
              </Button>
              <Button
                size="sm"
                full={false}
                loading={del.isPending}
                className="flex-1 bg-neg font-extrabold text-white"
                onClick={() =>
                  del.mutate(e.id, {
                    onSuccess: () => {
                      toast('Gasto excluído')
                      onClose()
                    },
                  })
                }
              >
                Sim, excluir
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="md"
              full={false}
              className="flex-1"
              icon={<Pencil size={18} strokeWidth={2.2} />}
              onClick={() => navigate(`/g/${groupId}/gasto/${e.id}/editar`)}
            >
              Editar
            </Button>
            <Button
              variant="negSoft"
              size="md"
              full={false}
              className="flex-1"
              icon={<Trash2 size={18} strokeWidth={2.2} />}
              onClick={() => setConfirming(true)}
            >
              Excluir
            </Button>
          </div>
        )
      ) : (
        <p className="m-0 text-center text-xs leading-[1.45] text-ink2">Só quem lançou ou quem pagou pode editar esse gasto.</p>
      )}
    </>
  )
}
