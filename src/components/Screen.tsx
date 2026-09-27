import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

/** Container de tela: ocupa a altura do shell e entra com fade + translateY (raIn). */
export function Screen({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('relative flex min-h-0 flex-1 flex-col animate-ra-in', className)}>{children}</div>
}

export function ScreenHeader({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('flex flex-none items-center gap-3 px-5 py-2', className)}>{children}</div>
}

export function ScreenTitle({ title, subtitle }: { title: string; subtitle?: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col">
      <h1 className="m-0 truncate text-[17px] font-extrabold text-ink">{title}</h1>
      {subtitle && <div className="truncate text-xs text-ink2">{subtitle}</div>}
    </div>
  )
}

const RESERVE = {
  none: 'pb-[calc(26px+env(safe-area-inset-bottom))]',
  // FAB: 26 (bottom) + 64 (altura) + folga
  fab: 'pb-[calc(120px+env(safe-area-inset-bottom))]',
  // botão fixo: 28 (degradê) + 58 (botão) + 26 (bottom) + folga
  bar: 'pb-[calc(132px+env(safe-area-inset-bottom))]',
} as const

/**
 * Área rolável. `reserve` garante espaço inferior para o que flutua por cima
 * (FAB ou botão fixo), para nada ficar coberto.
 */
export function ScrollArea({
  children,
  className,
  reserve = 'none',
}: {
  children: ReactNode
  className?: string
  reserve?: keyof typeof RESERVE
}) {
  return <div className={cn('min-h-0 flex-1 overflow-y-auto px-5', RESERVE[reserve], className)}>{children}</div>
}

/** Botão fixo inferior com degradê de --bg por trás (Home). */
export function FloatingBar({ children }: { children: ReactNode }) {
  return (
    <div className="absolute inset-x-0 bottom-0 z-10 bg-[linear-gradient(to_top,var(--bg)_62%,transparent)] px-5 pt-7 pb-[calc(26px+env(safe-area-inset-bottom))]">
      {children}
    </div>
  )
}

/** Rodapé fixo com divisor (Novo gasto). */
export function FooterBar({ children, bordered = true }: { children: ReactNode; bordered?: boolean }) {
  return (
    <div
      className={cn(
        'flex-none bg-bg px-5 pt-3 pb-[calc(26px+env(safe-area-inset-bottom))]',
        bordered && 'border-t border-line',
      )}
    >
      {children}
    </div>
  )
}

/** Estado vazio/erro no estilo do design: tile 96, título 21/800, texto 15 ink2. */
export function EmptyState({
  icon,
  title,
  text,
  action,
  round = false,
  tone = 'surface',
}: {
  icon: ReactNode
  title: string
  text?: ReactNode
  action?: ReactNode
  round?: boolean
  tone?: 'surface' | 'pos' | 'neg'
}) {
  return (
    <div className="flex animate-ra-in-slow flex-col items-center gap-3.5 px-4 pt-9 pb-5 text-center">
      <div
        className={cn(
          'flex size-24 items-center justify-center text-[44px]',
          round ? 'rounded-full' : 'rounded-[32px]',
          tone === 'surface' && 'bg-surface shadow-card',
          tone === 'pos' && 'bg-pos-bg text-pos',
          tone === 'neg' && 'bg-neg-bg text-neg',
        )}
      >
        {icon}
      </div>
      <h2 className="m-0 text-[21px] font-extrabold tracking-[-0.02em] text-ink">{title}</h2>
      {text && <p className="m-0 max-w-[280px] text-[15px] leading-normal text-pretty text-ink2">{text}</p>}
      {action && <div className="mt-1.5">{action}</div>}
    </div>
  )
}
