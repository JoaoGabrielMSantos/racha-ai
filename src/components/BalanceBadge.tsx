import { Check } from 'lucide-react'
import { formatBRLAbs } from '@/lib/money'
import { balanceCaption } from '@/lib/format'

/** Pílula de saldo. amount em centavos, com sinal. */
export function BalancePill({ amount }: { amount: number }) {
  if (amount === 0) {
    return (
      <span className="flex items-center gap-[5px] whitespace-nowrap rounded-full bg-surface2 px-[11px] py-1.5 text-[13px] font-bold text-ink2">
        <Check size={12} strokeWidth={3} />
        Quite
      </span>
    )
  }
  const pos = amount > 0
  return (
    <span
      className={
        'tabular whitespace-nowrap rounded-full px-[11px] py-1.5 text-sm font-extrabold tracking-[-0.01em] ' +
        (pos ? 'bg-pos-bg text-pos' : 'bg-neg-bg text-neg')
      }
    >
      {pos ? '+' : '−'} {formatBRLAbs(amount)}
    </span>
  )
}

/** Badge do design: pílula + legenda opcional abaixo ("a receber" / "a pagar"). */
export function BalanceBadge({ amount, caption = false }: { amount: number; caption?: boolean }) {
  const cap = caption ? balanceCaption(amount) : null
  return (
    <div className="flex flex-none flex-col items-end gap-1">
      <BalancePill amount={amount} />
      {cap && <div className="pr-1 text-[11px] font-semibold text-ink2">{cap}</div>}
    </div>
  )
}
