import { describe, expect, it } from 'vitest'
import { splitEqually, sumShares } from './split'
import { rng } from './test-utils'

describe('splitEqually', () => {
  it('divide exato quando fecha', () => {
    expect(splitEqually(9000, ['a', 'b', 'c'])).toEqual([
      { userId: 'a', amountCents: 3000 },
      { userId: 'b', amountCents: 3000 },
      { userId: 'c', amountCents: 3000 },
    ])
  })

  it('os primeiros recebem +1 centavo do resto', () => {
    // R$ 100,00 / 3 = 33,33 + 1 centavo pro primeiro
    expect(splitEqually(10000, ['a', 'b', 'c']).map((s) => s.amountCents)).toEqual([3334, 3333, 3333])
    // R$ 0,05 / 3 → 2, 2, 1
    expect(splitEqually(5, ['a', 'b', 'c']).map((s) => s.amountCents)).toEqual([2, 2, 1])
  })

  it('valor menor que o nº de pessoas: alguns ficam com 0', () => {
    expect(splitEqually(2, ['a', 'b', 'c', 'd']).map((s) => s.amountCents)).toEqual([1, 1, 0, 0])
  })

  it('protótipo: Airbnb R$ 1.840,00 / 4', () => {
    expect(splitEqually(184000, ['me', 'ana', 'bia', 'caio']).map((s) => s.amountCents)).toEqual([46000, 46000, 46000, 46000])
  })

  it('lista vazia → []', () => {
    expect(splitEqually(1000, [])).toEqual([])
  })

  it('rejeita valor inválido', () => {
    expect(() => splitEqually(-1, ['a'])).toThrow(RangeError)
    expect(() => splitEqually(10.5, ['a'])).toThrow(RangeError)
  })

  it('propriedade: soma exata e diferença máxima de 1 centavo (1000 casos)', () => {
    const r = rng(42)
    for (let k = 0; k < 1000; k++) {
      const n = r.int(1, 12)
      const total = r.int(0, 99_999_999)
      const ids = Array.from({ length: n }, (_, i) => `u${i}`)
      const shares = splitEqually(total, ids)
      expect(sumShares(shares)).toBe(total)
      const amounts = shares.map((s) => s.amountCents)
      expect(Math.max(...amounts) - Math.min(...amounts)).toBeLessThanOrEqual(1)
      // quem recebe o centavo extra vem primeiro
      expect([...amounts].sort((a, b) => b - a)).toEqual(amounts)
    }
  })
})
