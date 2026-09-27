import type { InputHTMLAttributes, ReactNode, Ref } from 'react'
import { useId } from 'react'
import { cn } from '@/lib/cn'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  /** 'default' = 58px surface; 'inset' = 54px surface2 (dentro de card, ex. chave Pix). */
  tone?: 'default' | 'inset'
  invalid?: boolean
  ref?: Ref<HTMLInputElement>
}

export function Input({ tone = 'default', invalid, className, ref, ...rest }: InputProps) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        'w-full border-[1.5px] font-semibold text-ink outline-none transition-colors duration-150 focus:border-brand',
        tone === 'default'
          ? 'h-[58px] rounded-[18px] bg-surface px-[18px] text-base'
          : 'h-[54px] rounded-2xl bg-surface2 px-4 text-base',
        invalid ? 'border-neg' : 'border-line',
        className,
      )}
      {...rest}
    />
  )
}

export function Label({ htmlFor, children }: { htmlFor?: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="text-[13px] font-bold text-ink2">
      {children}
    </label>
  )
}

export function FieldError({ id, children }: { id?: string; children?: ReactNode }) {
  if (!children) return null
  return (
    <div id={id} role="alert" className="px-1 text-[13px] font-bold text-neg">
      {children}
    </div>
  )
}

type FieldProps = {
  label: string
  error?: string
  hint?: ReactNode
  children: (ids: { id: string; describedBy?: string }) => ReactNode
  gap?: 'sm' | 'md'
}

/** Label + controle + erro, com ids ligados para acessibilidade. */
export function Field({ label, error, hint, children, gap = 'sm' }: FieldProps) {
  const id = useId()
  const errId = `${id}-err`
  return (
    <div className={cn('flex flex-col', gap === 'sm' ? 'gap-2.5' : 'gap-3')}>
      <Label htmlFor={id}>{label}</Label>
      {children({ id, describedBy: error ? errId : undefined })}
      <FieldError id={errId}>{error}</FieldError>
      {hint}
    </div>
  )
}
