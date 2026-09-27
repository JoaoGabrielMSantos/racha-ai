/** Datas de gasto são `date` (YYYY-MM-DD) no fuso local de quem lança. */

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

/** Date → "YYYY-MM-DD" no fuso local (não em UTC). */
export function toISODate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number]
  return toISODate(new Date(y, m - 1, d + days))
}

/** "Hoje", "Ontem", "16 set" ou, se de outro ano, "16 set 2025". */
export function dayLabel(iso: string, today: string = toISODate(new Date())): string {
  if (iso === today) return 'Hoje'
  if (iso === addDays(today, -1)) return 'Ontem'
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number]
  const base = `${d} ${MONTHS[m - 1]}`
  return String(y) === today.slice(0, 4) ? base : `${base} ${y}`
}

export type DayGroup<T> = { date: string; label: string; items: T[] }

/**
 * Agrupa por dia, do mais recente para o mais antigo. Dentro do dia, mais recente primeiro
 * (por `created_at`).
 */
export function groupByDay<T extends { expense_date: string; created_at: string }>(
  items: readonly T[],
  today?: string,
): DayGroup<T>[] {
  const sorted = [...items].sort((a, b) =>
    a.expense_date !== b.expense_date
      ? a.expense_date < b.expense_date
        ? 1
        : -1
      : a.created_at < b.created_at
        ? 1
        : a.created_at > b.created_at
          ? -1
          : 0,
  )
  const groups: DayGroup<T>[] = []
  for (const item of sorted) {
    const last = groups[groups.length - 1]
    if (last && last.date === item.expense_date) last.items.push(item)
    else groups.push({ date: item.expense_date, label: dayLabel(item.expense_date, today), items: [item] })
  }
  return groups
}
