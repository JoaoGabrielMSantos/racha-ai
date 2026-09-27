import { Skeleton } from '@/components/Skeleton'
import { formatBRL } from '@/lib/money'
import { myBalanceLabel } from '@/lib/group-money'
import { cn } from '@/lib/cn'

/** Card "Você tem a receber / Você deve no grupo / Você tá quite" do topo do grupo. */
export function BalanceCard({ value, loading, onSettle }: { value: number; loading?: boolean; onSettle: () => void }) {
  if (loading) return <Skeleton className="h-[88px] flex-none rounded-[26px]" />
  return (
    <div className="flex flex-none items-center justify-between gap-3 rounded-[26px] bg-surface px-5 py-[18px] shadow-card">
      <div className="flex min-w-0 flex-col gap-1">
        <div className="text-[13px] font-bold text-ink2">{myBalanceLabel(value)}</div>
        <div
          className={cn(
            'tabular text-[34px] leading-[1.15] font-extrabold tracking-[-0.04em] whitespace-nowrap',
            value > 0 ? 'text-pos' : value < 0 ? 'text-neg' : 'text-ink',
          )}
        >
          {formatBRL(Math.abs(value))}
        </div>
      </div>
      {value < 0 && (
        <button
          type="button"
          onClick={onSettle}
          className="h-[42px] flex-none rounded-full bg-neg-bg px-4 text-sm font-extrabold text-neg transition-transform duration-150 active:scale-[.97]"
        >
          Acertar
        </button>
      )}
    </div>
  )
}
