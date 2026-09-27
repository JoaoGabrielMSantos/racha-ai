import type { CSSProperties } from 'react'
import { Check } from 'lucide-react'
import { initialsOf } from '@/lib/format'

const SIZES = { sm: 28, md: 40, lg: 52, xl: 88 } as const
export type AvatarSize = keyof typeof SIZES

type Props = {
  name: string
  hue: number
  size?: AvatarSize
  selected?: boolean
  onClick?: () => void
  className?: string
}

export function Avatar({ name, hue, size = 'md', selected = false, onClick, className }: Props) {
  const sz = SIZES[size]
  const style: CSSProperties = {
    width: sz,
    height: sz,
    background: `oklch(0.83 0.1 ${hue})`,
    fontSize: Math.round(sz * 0.36),
    boxShadow: selected
      ? '0 0 0 2.5px var(--surface), 0 0 0 5px var(--brand)'
      : '0 0 0 2px var(--surface)',
  }
  const cls =
    'relative flex flex-none select-none items-center justify-center rounded-full font-extrabold tracking-[-0.02em] text-[#132220] transition-shadow duration-150 ' +
    (className ?? '')
  const badge = selected && (
    <span className="absolute -right-[3px] -bottom-[3px] flex size-[18px] items-center justify-center rounded-full border-2 border-surface bg-brand text-on-brand">
      <Check size={10} strokeWidth={3.5} />
    </span>
  )

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={cls} style={style} aria-label={name} aria-pressed={selected}>
        {initialsOf(name)}
        {badge}
      </button>
    )
  }
  return (
    <div className={cls} style={style} aria-hidden="true">
      {initialsOf(name)}
      {badge}
    </div>
  )
}
