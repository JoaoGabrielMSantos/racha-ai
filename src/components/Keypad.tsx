import { useEffect } from 'react'
import { Delete } from 'lucide-react'
import type { KeypadKey } from '@/lib/money'

const KEYS: KeypadKey[] = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', 'backspace']

type Props = {
  onKey: (k: KeypadKey) => void
  /** Enter no teclado físico. */
  onEnter?: () => void
}

/**
 * Teclado 3×4 do "Novo gasto" (teclas 62px surface, raio 20).
 * Correção sobre o design: também aceita o teclado físico (dígitos, Backspace, Enter).
 */
export function Keypad({ onKey, onEnter }: Props) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault()
        onKey(e.key as KeypadKey)
      } else if (e.key === 'Backspace') {
        e.preventDefault()
        onKey('backspace')
      } else if (e.key === 'Enter' && onEnter) {
        e.preventDefault()
        onEnter()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onKey, onEnter])

  return (
    <div className="grid grid-cols-3 gap-2" role="group" aria-label="Teclado numérico">
      {KEYS.map((k) => (
        <button
          key={k}
          type="button"
          onClick={() => onKey(k)}
          aria-label={k === 'backspace' ? 'Apagar' : k}
          className="flex h-[62px] items-center justify-center rounded-[20px] bg-surface text-2xl font-bold text-ink shadow-card transition-transform duration-100 select-none active:scale-[.97] active:bg-surface2"
        >
          {k === 'backspace' ? <Delete size={24} strokeWidth={2.2} /> : k}
        </button>
      ))}
    </div>
  )
}
