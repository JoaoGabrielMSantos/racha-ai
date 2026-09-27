import { describe, expect, it } from 'vitest'
import { homeTotals } from './totals'

describe('homeTotals', () => {
  it('soma positivos em "a receber" e negativos em "a pagar"', () => {
    expect(homeTotals([{ myBalanceCents: 4500 }, { myBalanceCents: -6720 }, { myBalanceCents: 0 }, { myBalanceCents: 100 }])).toEqual({
      receive: 4600,
      pay: 6720,
    })
  })
  it('sem grupos → zero', () => {
    expect(homeTotals([])).toEqual({ receive: 0, pay: 0 })
  })
})
