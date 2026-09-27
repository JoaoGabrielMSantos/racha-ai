import { formatBRL } from '@/lib/money'
import { cn } from '@/lib/cn'

/**
 * Card "A receber" / "A pagar" da Home.
 * Correção sobre o design: valor em nowrap e com tamanho relativo ao próprio card
 * (container query), para caber até R$ 99.999,99 em telas estreitas.
 */
export function TotalCard({ kind, cents }: { kind: 'receive' | 'pay'; cents: number }) {
  const pos = kind === 'receive'
  return (
    <div className="@container flex min-w-0 flex-col gap-1.5 rounded-3xl bg-surface px-[18px] py-4 shadow-card">
      <div className="flex items-center gap-1.5 text-xs font-bold text-ink2">
        <span className={cn('size-2 rounded-full', pos ? 'bg-pos' : 'bg-neg')} aria-hidden="true" />
        {pos ? 'A receber' : 'A pagar'}
      </div>
      <div
        className={cn(
          'tabular text-[clamp(14px,12.5cqi,22px)] font-extrabold tracking-[-0.03em] whitespace-nowrap',
          pos ? 'text-pos' : 'text-neg',
        )}
      >
        {formatBRL(cents)}
      </div>
    </div>
  )
}
