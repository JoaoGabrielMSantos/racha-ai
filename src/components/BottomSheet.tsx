import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { IconButton } from './IconButton'
import { cn } from '@/lib/cn'

type Props = {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
}

/**
 * Bottom sheet do design: scrim com fade 250ms, painel sobe em 320ms cubic-bezier(.2,.9,.3,1).
 * Continua montado durante a animação de saída.
 */
export function BottomSheet({ open, title, onClose, children }: Props) {
  const [mounted, setMounted] = useState(open)
  const titleId = useId()
  const panelRef = useRef<HTMLDivElement>(null)

  // Ajuste de estado durante o render (padrão recomendado pelo React), sem effect.
  if (open && !mounted) setMounted(true)

  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    panelRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      prev?.focus?.()
    }
  }, [open, onClose])

  // Fallback: se a aba estiver oculta, animationend não dispara e o sheet ficaria preso.
  const closing = !open && mounted
  useEffect(() => {
    if (!closing) return
    const t = window.setTimeout(() => setMounted(false), 300)
    return () => window.clearTimeout(t)
  }, [closing])

  if (!mounted) return null

  return createPortal(
    <div className="fixed inset-0 z-20 flex justify-center">
      <div className="relative flex h-full w-full max-w-[480px] flex-col justify-end">
        <div
          className={cn('absolute inset-0 bg-scrim', closing ? 'animate-ra-fade-out' : 'animate-ra-fade')}
          onClick={onClose}
          aria-hidden="true"
        />
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          onAnimationEnd={(e) => {
            if (closing && e.target === e.currentTarget) setMounted(false)
          }}
          className={cn(
            'relative flex max-h-[92%] flex-col gap-4 overflow-y-auto rounded-t-[32px] bg-surface px-[22px] pt-2.5 outline-none',
            'pb-[calc(26px+env(safe-area-inset-bottom))]',
            closing ? 'animate-ra-sheet-out' : 'animate-ra-sheet',
          )}
        >
          <div className="mb-0.5 h-[5px] w-10 flex-none self-center rounded-full bg-line" aria-hidden="true" />
          <div className="flex items-center justify-between gap-3">
            <h2 id={titleId} className="m-0 text-lg font-extrabold text-ink">
              {title}
            </h2>
            <IconButton label="Fechar" tone="sheet" onClick={onClose}>
              <X size={16} strokeWidth={2.6} />
            </IconButton>
          </div>
          {children}
        </div>
      </div>
    </div>,
    document.body,
  )
}
