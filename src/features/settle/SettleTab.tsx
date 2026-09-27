import { useState } from 'react'
import { ArrowRight, Check } from 'lucide-react'
import { friendlyError } from '@/api/errors'
import type { Member } from '@/api/groups'
import { canUndoSettlement, useCreateSettlement, useDeleteSettlement, type Settlement } from '@/api/settlements'
import { Avatar } from '@/components/Avatar'
import { Button } from '@/components/Button'
import { PixDiamond } from '@/components/Logo'
import { EmptyState } from '@/components/Screen'
import { LoadingList } from '@/components/Skeleton'
import { useToast } from '@/components/toast-context'
import { cn } from '@/lib/cn'
import { dayLabel, toISODate } from '@/lib/dates'
import { reminderMessage } from '@/lib/group-money'
import { formatBRL } from '@/lib/money'
import { firstName, fullName, shortName } from '@/lib/names'
import type { Transfer } from '@/lib/settle'
import { openWhatsApp } from '@/lib/share'
import { PixSheet } from './PixSheet'

type Props = {
  groupId: string
  groupName: string
  pending: Transfer[]
  settlements: Settlement[]
  hasExpenses: boolean
  memberMap: Map<string, Member>
  meId: string
  loading: boolean
  error?: string
}

/** Aba Acertos: pendentes (com ações por papel), "Tudo acertado" e "Já pagos" com Desfazer. */
export function SettleTab({ groupId, groupName, pending, settlements, hasExpenses, memberMap, meId, loading, error }: Props) {
  const toast = useToast()
  const create = useCreateSettlement(groupId)
  const undo = useDeleteSettlement(groupId)
  const [pixFor, setPixFor] = useState<Transfer | null>(null)
  const [busy, setBusy] = useState<string | null>(null)

  if (loading) return <LoadingList count={2} />
  if (error) return <EmptyState icon="😵" title="Não deu pra carregar" text={error} />

  const person = (id: string) => memberMap.get(id) ?? { id, displayName: null, avatarHue: 170 }
  const groupLink = `${window.location.origin}/g/${groupId}`

  const mark = (t: Transfer, msg: string) => {
    const key = `${t.from}>${t.to}`
    setBusy(key)
    create.mutate(
      { from: t.from, to: t.to, amountCents: t.amountCents, createdBy: meId },
      {
        onSuccess: () => toast(msg),
        onError: (e) => toast(friendlyError(e)),
        onSettled: () => setBusy(null),
      },
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {pending.map((t) => {
        const fromMe = t.from === meId
        const toMe = t.to === meId
        const from = person(t.from)
        const to = person(t.to)
        const key = `${t.from}>${t.to}`
        return (
          <article key={key} className="flex animate-ra-in flex-col gap-3.5 rounded-3xl bg-surface p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="flex flex-none items-center gap-1" aria-hidden="true">
                <Avatar name={fullName(from)} hue={from.avatarHue} size="sm" />
                <ArrowRight size={16} strokeWidth={2.4} className="text-ink2" />
                <Avatar name={fullName(to)} hue={to.avatarHue} size="sm" />
              </div>
              <div className="min-w-0 flex-1 truncate text-[15px] font-bold text-ink">
                {shortName(from, meId)} → {shortName(to, meId)}
              </div>
              <div
                className={cn(
                  'tabular flex-none text-lg font-extrabold tracking-[-0.02em]',
                  fromMe ? 'text-neg' : toMe ? 'text-pos' : 'text-ink',
                )}
              >
                {formatBRL(t.amountCents)}
              </div>
            </div>

            {fromMe ? (
              <div className="flex gap-2">
                <Button size="md" full={false} className="flex-1 gap-2.5" icon={<PixDiamond />} onClick={() => setPixFor(t)}>
                  Pagar com Pix
                </Button>
                <Button
                  variant="secondary"
                  size="md"
                  full={false}
                  className="px-3.5 text-sm"
                  loading={busy === key}
                  onClick={() => mark(t, 'Pagamento registrado')}
                >
                  Já paguei
                </Button>
              </div>
            ) : toMe ? (
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="md"
                  full={false}
                  className="flex-1 text-sm"
                  onClick={() => openWhatsApp(reminderMessage(firstName(from.displayName) || 'galera', t.amountCents, groupName, groupLink))}
                >
                  Lembrar no WhatsApp
                </Button>
                <Button
                  variant="posSoft"
                  size="md"
                  full={false}
                  className="px-4 text-sm"
                  loading={busy === key}
                  onClick={() => mark(t, 'Recebimento confirmado')}
                >
                  Recebi
                </Button>
              </div>
            ) : (
              <Button variant="secondary" size="sm" loading={busy === key} onClick={() => mark(t, 'Marcado como pago')}>
                Marcar como pago
              </Button>
            )}
          </article>
        )
      })}

      {!pending.length &&
        (hasExpenses ? (
          <EmptyState
            round
            tone="pos"
            icon={<Check size={44} strokeWidth={2.6} />}
            title="Tudo acertado 🎉"
            text="Ninguém deve nada a ninguém neste grupo. Bora pro próximo rolê?"
          />
        ) : (
          <p className="m-0 px-4 py-8 text-center text-[15px] text-ink2">
            Nada pra acertar ainda. Quando alguém lançar um gasto, as contas aparecem aqui.
          </p>
        ))}

      {settlements.length > 0 && (
        <section className="mt-2 flex flex-col gap-3" aria-label="Já pagos">
          <h2 className="m-0 text-[13px] font-bold text-ink2">Já pagos</h2>
          <ul className="m-0 list-none rounded-[22px] bg-surface px-4 py-0.5 shadow-card">
            {settlements.map((s, i) => (
              <li key={s.id} className={cn('flex items-center gap-3 py-3', i > 0 && 'border-t border-line')}>
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="truncate text-sm font-bold text-ink">
                    {shortName(person(s.fromUser), meId)} → {shortName(person(s.toUser), meId)}
                  </div>
                  <div className="text-xs text-ink2">
                    <span className="tabular">{formatBRL(s.amountCents)}</span> · {dayLabel(toISODate(new Date(s.paidAt)))}
                  </div>
                </div>
                {canUndoSettlement(s, meId) && (
                  <Button
                    variant="ghost"
                    full={false}
                    className="h-11 px-2 text-[13px]"
                    loading={undo.isPending && undo.variables === s.id}
                    onClick={() =>
                      undo.mutate(s.id, {
                        onSuccess: () => toast('Pagamento desfeito'),
                        onError: (e) => toast(friendlyError(e)),
                      })
                    }
                  >
                    Desfazer
                  </Button>
                )}
                <span className="flex h-7 flex-none items-center gap-1 rounded-full bg-pos-bg px-2.5 text-xs font-extrabold text-pos">
                  <Check size={12} strokeWidth={3.2} />
                  Pago
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <PixSheet
        transfer={pixFor}
        groupId={groupId}
        groupName={groupName}
        members={memberMap}
        meId={meId}
        onClose={() => setPixFor(null)}
      />
    </div>
  )
}
