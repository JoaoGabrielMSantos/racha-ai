import { cn } from '@/lib/cn'

export type TabDef<K extends string> = { key: K; label: string; count?: number }

type Props<K extends string> = {
  tabs: TabDef<K>[]
  value: K
  onChange: (key: K) => void
  label: string
}

/** Trilho surface2 raio 18; tab ativa surface + sombra leve, 42px. Contador coral opcional. */
export function SegmentedTabs<K extends string>({ tabs, value, onChange, label }: Props<K>) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="grid flex-none gap-1 rounded-[18px] bg-surface2 p-1"
      style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
    >
      {tabs.map((t) => {
        const active = t.key === value
        return (
          <button
            key={t.key}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.key)}
            className={cn(
              'flex h-[42px] items-center justify-center gap-1.5 rounded-[14px] text-sm transition-all duration-150',
              active ? 'bg-surface font-extrabold text-ink shadow-tab' : 'bg-transparent font-semibold text-ink2',
            )}
          >
            {t.label}
            {!!t.count && (
              <span
                className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-neg px-1.5 text-[11px] font-extrabold text-white"
                aria-label={`${t.count} pendentes`}
              >
                {t.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
