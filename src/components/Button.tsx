import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'whatsapp' | 'ghost' | 'danger' | 'posSoft' | 'negSoft' | 'blocked'
type Size = 'lg' | 'md' | 'sm'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand text-on-brand font-bold',
  secondary: 'border-[1.5px] border-line bg-surface text-ink font-bold',
  whatsapp: 'bg-whatsapp text-on-whatsapp font-bold',
  ghost: 'bg-transparent text-ink2 font-bold',
  danger: 'bg-transparent text-neg font-extrabold',
  posSoft: 'bg-pos-bg text-pos font-extrabold',
  negSoft: 'bg-neg-bg text-neg font-extrabold',
  // botão cinza com o motivo da invalidez (Novo gasto)
  blocked: 'bg-surface2 text-ink2 font-bold cursor-not-allowed',
}

const SIZES: Record<Size, string> = {
  lg: 'h-[58px] rounded-[20px] text-base',
  md: 'h-[50px] rounded-2xl text-[15px]',
  sm: 'h-[46px] rounded-2xl text-sm',
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  icon?: ReactNode
  loading?: boolean
  full?: boolean
}

export function Button({
  variant = 'primary',
  size = 'lg',
  icon,
  loading = false,
  full = true,
  disabled,
  className,
  children,
  type = 'button',
  ...rest
}: Props) {
  const isDisabled = disabled || loading
  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cn(
        'flex shrink-0 items-center justify-center gap-2 px-4 transition-transform duration-150',
        VARIANTS[variant],
        SIZES[size],
        full && 'w-full',
        !isDisabled && variant !== 'blocked' && 'active:scale-[.98]',
        isDisabled && variant !== 'blocked' && 'cursor-not-allowed opacity-40',
        className,
      )}
      {...rest}
    >
      {loading ? <Spinner /> : icon}
      {children}
    </button>
  )
}

export function Spinner({ size = 18 }: { size?: number }) {
  return (
    <span
      aria-hidden="true"
      className="inline-block flex-none animate-ra-spin rounded-full border-[2.5px] border-current border-r-transparent"
      style={{ width: size, height: size }}
    />
  )
}
