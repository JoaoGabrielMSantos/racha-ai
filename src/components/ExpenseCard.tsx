import { Avatar } from './Avatar'
import { formatBRL } from '@/lib/money'

type Props = {
  description: string
  payerName: string
  payerShort: string
  hue: number
  amount: number
  myShare: number
  iPaid: boolean
  onClick?: () => void
}

/** Linha de gasto. A data fica no cabeçalho do dia (ver ExpenseList), não no card. */
export function ExpenseCard({ description, payerName, payerShort, hue, amount, myShare, iPaid, onClick }: Props) {
  const lent = amount - myShare
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3.5 rounded-[22px] bg-surface px-4 py-3.5 text-left shadow-card transition-transform duration-150 active:scale-[.985]"
    >
      <Avatar name={payerName} hue={hue} size="md" />
      <div className="flex min-w-0 flex-1 flex-col gap-[3px]">
        <div className="line-clamp-2 text-[15px] leading-[1.3] font-bold text-pretty text-ink">{description}</div>
        <div className="truncate text-[13px] text-ink2">{payerShort} pagou</div>
      </div>
      <div className="flex flex-none flex-col items-end gap-[3px]">
        <div className="tabular text-base font-extrabold tracking-[-0.01em] text-ink">{formatBRL(amount)}</div>
        {iPaid ? (
          lent > 0 && <div className="whitespace-nowrap text-xs font-bold text-pos">+ {formatBRL(lent)}</div>
        ) : myShare > 0 ? (
          <div className="whitespace-nowrap text-xs font-bold text-neg">sua parte: {formatBRL(myShare)}</div>
        ) : (
          <div className="whitespace-nowrap text-xs font-semibold text-ink2">você tá fora</div>
        )}
      </div>
    </button>
  )
}
