import { useLayoutEffect, useRef, useState } from 'react'
import { BalancePill } from './BalanceBadge'
import { balanceCaption, groupMeta } from '@/lib/format'
import { cn } from '@/lib/cn'

type Props = {
  name: string
  emoji: string
  memberCount: number
  expenseCount: number
  balance: number
  onClick?: () => void
}

/**
 * Card de grupo da Home.
 * Correção sobre o design: o nome usa a largura toda (até 2 linhas) e o badge desce para
 * a linha de "membros · gastos", alinhado à direita (se não couber, quebra para a linha de
 * baixo, ainda à direita). A legenda ("a receber") só aparece se couber tudo numa linha.
 */
export function GroupCard({ name, emoji, memberCount, expenseCount, balance, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3.5 rounded-[26px] bg-surface py-3.5 pr-4 pl-3.5 text-left shadow-card transition-transform duration-150 active:scale-[.985]"
    >
      <div className="flex size-14 flex-none items-center justify-center rounded-[19px] bg-surface2 text-[28px]" aria-hidden="true">
        {emoji}
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="line-clamp-2 text-base leading-[1.3] font-bold break-words text-ink">{name}</div>
        <MetaRow meta={groupMeta(memberCount, expenseCount)} balance={balance} />
      </div>
    </button>
  )
}

function MetaRow({ meta, balance }: { meta: string; balance: number }) {
  const rowRef = useRef<HTMLDivElement>(null)
  const metaRef = useRef<HTMLSpanElement>(null)
  const capRef = useRef<HTMLSpanElement>(null)
  const pillRef = useRef<HTMLSpanElement>(null)
  const [showCap, setShowCap] = useState(false)
  const caption = balanceCaption(balance)

  useLayoutEffect(() => {
    const row = rowRef.current
    if (!row || !caption) return
    const GAP = 8
    const measure = () => {
      const need =
        (metaRef.current?.scrollWidth ?? 0) +
        GAP +
        (capRef.current?.offsetWidth ?? 0) +
        GAP +
        (pillRef.current?.offsetWidth ?? 0)
      setShowCap(need <= row.clientWidth)
    }
    const ro = new ResizeObserver(measure)
    ;[row, metaRef.current, pillRef.current].forEach((el) => el && ro.observe(el))
    return () => ro.disconnect()
  }, [caption, meta])

  return (
    <div ref={rowRef} className="relative flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
      <span ref={metaRef} className="min-w-0 truncate text-[13px] text-ink2">
        {meta}
      </span>
      {caption && (
        <span
          ref={capRef}
          aria-hidden={!showCap}
          className={cn(
            'flex-none whitespace-nowrap text-[11px] font-semibold text-ink2',
            !showCap && 'pointer-events-none invisible absolute',
          )}
        >
          {caption}
        </span>
      )}
      <span ref={pillRef} className="ml-auto flex-none">
        <BalancePill amount={balance} />
      </span>
    </div>
  )
}
