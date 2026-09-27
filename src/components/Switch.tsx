import { cn } from '@/lib/cn'

/** Trilho 52×32, knob 26 branco; trilho --brand quando ligado. */
export function SwitchVisual({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        'flex h-8 w-[52px] flex-none rounded-full p-[3px] transition-colors duration-200',
        on ? 'bg-brand' : 'bg-surface2',
      )}
    >
      <span
        className={cn(
          'size-[26px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,.2)] transition-transform duration-200',
          on && 'translate-x-5',
        )}
      />
    </span>
  )
}

type Props = { label: string; checked: boolean; onChange: (checked: boolean) => void }

/** Linha "Modo escuro" do Perfil: a linha inteira é o switch. */
export function SwitchRow({ label, checked, onChange }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full flex-none items-center justify-between rounded-[22px] bg-surface px-[18px] py-4 text-left shadow-card"
    >
      <span className="text-[15px] font-bold text-ink">{label}</span>
      <SwitchVisual on={checked} />
    </button>
  )
}
