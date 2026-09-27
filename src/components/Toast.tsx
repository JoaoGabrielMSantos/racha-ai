import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { ToastContext } from './toast-context'

type ToastState = { id: number; message: string } | null

/** Pílula --ink com texto --bg, bottom 104px, some após 2,2s. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState>(null)
  const timer = useRef<number | undefined>(undefined)

  const show = useCallback((message: string) => {
    window.clearTimeout(timer.current)
    setToast({ id: Date.now(), message })
    timer.current = window.setTimeout(() => setToast(null), 2200)
  }, [])

  useEffect(() => () => window.clearTimeout(timer.current), [])

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-[calc(104px+env(safe-area-inset-bottom))] z-30 flex justify-center px-5"
      >
        {toast && (
          <div
            key={toast.id}
            className="animate-[ra-in_.25s_ease_both] whitespace-nowrap rounded-2xl bg-ink px-[18px] py-3 text-sm font-bold text-bg shadow-toast"
          >
            {toast.message}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  )
}
