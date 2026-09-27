import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  label: string
  /** 'screen' = 44px surface com sombra (headers); 'sheet' = 36px surface2 (bottom sheet). */
  tone?: 'screen' | 'sheet'
}

export function IconButton({ label, tone = 'screen', className, children, type = 'button', ...rest }: Props) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        'flex flex-none items-center justify-center rounded-full text-ink transition-transform duration-150 active:scale-95',
        tone === 'screen' ? 'size-11 bg-surface shadow-card' : 'size-9 bg-surface2',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
