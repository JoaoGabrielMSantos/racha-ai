type Props = {
  label: string
  active: boolean
  onClick: () => void
}

/** Chip pill reutilizado em modo de divisão, data e tipo de chave Pix. */
export function SplitChip({ label, active, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        'h-10 flex-none whitespace-nowrap rounded-full border-[1.5px] px-4 text-sm transition-all duration-150 ' +
        (active
          ? 'border-brand bg-brand font-bold text-on-brand'
          : 'border-line bg-surface font-semibold text-ink hover:border-brand')
      }
    >
      {label}
    </button>
  )
}
