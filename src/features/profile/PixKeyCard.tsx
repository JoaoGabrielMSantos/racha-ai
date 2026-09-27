import { useId } from 'react'
import { SplitChip } from '@/components/SplitChip'
import { Input, FieldError } from '@/components/Input'
import { PixDiamond } from '@/components/Logo'
import { PIX_KEY_LABELS, PIX_KEY_PLACEHOLDERS, type PixKeyType } from '@/lib/pix-key'
import { PIX_TYPES } from './profile-form'

type Props = {
  type: PixKeyType
  value: string
  error?: string
  /** E-mail da conta: preenche a chave ao escolher "E-mail" com o campo vazio (como no protótipo). */
  accountEmail?: string
  optional?: boolean
  onTypeChange: (t: PixKeyType) => void
  onValueChange: (v: string) => void
  onBlur?: () => void
}

const INPUT_MODE: Record<PixKeyType, 'numeric' | 'tel' | 'email' | 'text'> = {
  cpf: 'numeric',
  phone: 'tel',
  email: 'email',
  random: 'text',
}

/** Card "Sua chave Pix": chips de tipo + input com placeholder por tipo + nota. */
export function PixKeyCard({ type, value, error, accountEmail, optional, onTypeChange, onValueChange, onBlur }: Props) {
  const inputId = useId()
  const errId = `${inputId}-err`
  const noteId = `${inputId}-note`

  return (
    <section className="flex flex-none flex-col gap-3.5 rounded-[26px] bg-surface p-[18px] shadow-card" aria-labelledby={`${inputId}-t`}>
      <div className="flex items-center gap-2.5">
        <PixDiamond size={12} stroke={2.4} className="mx-[3px] text-brand-text" />
        <h2 id={`${inputId}-t`} className="m-0 text-base font-extrabold text-ink">
          Sua chave Pix
          {optional && <span className="ml-1.5 text-[13px] font-semibold text-ink2">(opcional)</span>}
        </h2>
      </div>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Tipo de chave">
        {PIX_TYPES.map((t) => (
          <SplitChip
            key={t}
            label={PIX_KEY_LABELS[t]}
            active={type === t}
            onClick={() => {
              if (t === type) return
              onTypeChange(t)
              onValueChange(t === 'email' && accountEmail ? accountEmail : '')
            }}
          />
        ))}
      </div>
      <label htmlFor={inputId} className="sr-only">
        Chave Pix ({PIX_KEY_LABELS[type]})
      </label>
      <Input
        id={inputId}
        tone="inset"
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        onBlur={onBlur}
        placeholder={PIX_KEY_PLACEHOLDERS[type]}
        inputMode={INPUT_MODE[type]}
        autoComplete={type === 'email' ? 'email' : type === 'phone' ? 'tel' : 'off'}
        autoCapitalize="off"
        spellCheck={false}
        invalid={!!error}
        aria-describedby={error ? `${errId} ${noteId}` : noteId}
      />
      <FieldError id={errId}>{error}</FieldError>
      <p id={noteId} className="m-0 text-[13px] leading-[1.45] text-ink2">
        É pra essa chave que a galera vai te pagar. Só aparece pra quem te deve.
      </p>
    </section>
  )
}
