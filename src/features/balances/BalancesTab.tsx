import type { Member } from '@/api/groups'
import { Avatar } from '@/components/Avatar'
import { EmptyState } from '@/components/Screen'
import { LoadingList } from '@/components/Skeleton'
import { cn } from '@/lib/cn'
import { balanceBar, balanceCaptionLong } from '@/lib/group-money'
import { formatSignedBRL } from '@/lib/money'
import { fullName } from '@/lib/names'
import type { Balances } from '@/lib/balances'

type Props = {
  balances: Balances | null
  members: Member[]
  memberMap: Map<string, Member>
  meId: string
  loading: boolean
  error?: string
}

/** Aba Saldos: uma linha por pessoa com barra de eixo central (verde → direita, coral → esquerda). */
export function BalancesTab({ balances, members, memberMap, meId, loading, error }: Props) {
  if (loading) return <LoadingList count={4} />
  if (error || !balances) return <EmptyState icon="😵" title="Não deu pra carregar" text={error} />

  // membros atuais + quem saiu mas ainda tem saldo ≠ 0 no histórico
  const ids = [...members.map((m) => m.id), ...Object.keys(balances).filter((id) => !memberMap.has(id) && balances[id] !== 0)]
  const maxAbs = Math.max(0, ...ids.map((id) => Math.abs(balances[id] ?? 0)))

  return (
    <ul className="m-0 list-none rounded-[26px] bg-surface px-[18px] py-1 shadow-card" aria-label="Saldo de cada pessoa">
      {ids.map((id, i) => {
        const v = balances[id] ?? 0
        const m = memberMap.get(id)
        const bar = balanceBar(v, maxAbs)
        const name = id === meId ? 'Você' : fullName(m)
        return (
          <li key={id} className={cn('flex items-center gap-3 py-3.5', i > 0 && 'border-t border-line')}>
            <Avatar name={fullName(m)} hue={m?.avatarHue ?? 170} size="md" />
            <div className="flex min-w-0 flex-1 flex-col gap-[9px]">
              <div className="flex items-baseline justify-between gap-2">
                <span className="truncate text-[15px] font-bold text-ink">{name}</span>
                <span
                  className={cn(
                    'tabular flex-none text-[15px] font-extrabold',
                    v > 0 ? 'text-pos' : v < 0 ? 'text-neg' : 'text-ink2',
                  )}
                >
                  {formatSignedBRL(v)}
                </span>
              </div>
              <div className="relative h-2 rounded-full bg-surface2" aria-hidden="true">
                <div className="absolute -top-1 -bottom-1 left-1/2 -ml-px w-0.5 rounded-sm bg-ink2 opacity-35" />
                <div
                  className={cn(
                    'absolute inset-y-0 rounded-full transition-[width] duration-400 ease-out',
                    v >= 0 ? 'left-1/2 bg-bar-pos' : 'right-1/2 bg-bar-neg',
                  )}
                  style={{ width: `${bar.widthPct}%` }}
                />
              </div>
              <div className="text-xs font-semibold text-ink2">{balanceCaptionLong(v)}</div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
