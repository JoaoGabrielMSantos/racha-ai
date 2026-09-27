import type { Ref } from 'react'
import { cn } from '@/lib/cn'

type Props = {
  id?: string
  value: string
  length?: number
  onChange: (v: string) => void
  /** Chamado quando o código fica completo (colar ou digitar o último dígito). */
  onComplete?: (v: string) => void
  invalid?: boolean
  disabled?: boolean
  describedBy?: string
  ref?: Ref<HTMLInputElement>
}

/**
 * Campo de código numérico (OTP). Um único input: funciona com colar, com o
 * preenchimento automático do SMS/e-mail (autocomplete="one-time-code") e com leitores de tela.
 */
export function CodeInput({ id, value, length = 6, onChange, onComplete, invalid, disabled, describedBy, ref }: Props) {
  return (
    <input
      ref={ref}
      id={id}
      value={value}
      disabled={disabled}
      inputMode="numeric"
      autoComplete="one-time-code"
      pattern="\d*"
      maxLength={length}
      placeholder={'•'.repeat(length)}
      aria-invalid={invalid || undefined}
      aria-describedby={describedBy}
      onChange={(e) => {
        const v = e.target.value.replace(/\D/g, '').slice(0, length)
        onChange(v)
        if (v.length === length) onComplete?.(v)
      }}
      className={cn(
        'tabular h-16 w-full rounded-[18px] border-[1.5px] bg-surface2 text-center text-[28px] font-extrabold tracking-[0.45em] text-ink outline-none transition-colors duration-150 focus:border-brand',
        'indent-[0.45em] placeholder:tracking-[0.45em]',
        invalid ? 'border-neg' : 'border-transparent',
        disabled && 'opacity-60',
      )}
    />
  )
}
