import { describe, expect, it } from 'vitest'
import { addDays, dayLabel, groupByDay, toISODate } from './dates'

const TODAY = '2026-09-27'

describe('dates', () => {
  it('toISODate usa o fuso local', () => {
    expect(toISODate(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05')
  })

  it('addDays atravessa mês e ano', () => {
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31')
  })

  it('dayLabel', () => {
    expect(dayLabel('2026-09-27', TODAY)).toBe('Hoje')
    expect(dayLabel('2026-09-26', TODAY)).toBe('Ontem')
    expect(dayLabel('2026-09-16', TODAY)).toBe('16 set')
    expect(dayLabel('2026-01-02', TODAY)).toBe('2 jan')
    expect(dayLabel('2025-12-31', TODAY)).toBe('31 dez 2025')
    expect(dayLabel('2025-12-31', '2026-01-01')).toBe('Ontem')
  })

  it('groupByDay: dias do mais recente pro mais antigo, com cabeçalho', () => {
    const items = [
      { id: 'a', expense_date: '2026-09-16', created_at: '2026-09-16T10:00:00Z' },
      { id: 'b', expense_date: '2026-09-27', created_at: '2026-09-27T09:00:00Z' },
      { id: 'c', expense_date: '2026-09-27', created_at: '2026-09-27T12:00:00Z' },
      { id: 'd', expense_date: '2026-09-26', created_at: '2026-09-27T08:00:00Z' },
    ]
    const g = groupByDay(items, TODAY)
    expect(g.map((x) => x.label)).toEqual(['Hoje', 'Ontem', '16 set'])
    expect(g[0]!.items.map((x) => x.id)).toEqual(['c', 'b'])
  })
})
