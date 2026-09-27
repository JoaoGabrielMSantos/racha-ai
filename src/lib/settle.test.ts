import { describe, expect, it } from 'vitest'
import { suggestSettlements, type Transfer } from './settle'
import { rng } from './test-utils'

/** Aplica as transferências: from paga to → from += x, to −= x. */
function apply(balances: Record<string, number>, transfers: Transfer[]) {
  const b = { ...balances }
  for (const t of transfers) {
    b[t.from] = (b[t.from] ?? 0) + t.amountCents
    b[t.to] = (b[t.to] ?? 0) - t.amountCents
  }
  return b
}

const allZero = (b: Record<string, number>) => Object.values(b).every((v) => v === 0)

describe('suggestSettlements', () => {
  it('ninguém deve nada → []', () => {
    expect(suggestSettlements({ a: 0, b: 0 })).toEqual([])
    expect(suggestSettlements({})).toEqual([])
  })

  it('2 pessoas', () => {
    expect(suggestSettlements({ ana: 5000, bia: -5000 })).toEqual([{ from: 'bia', to: 'ana', amountCents: 5000 }])
  })

  it('3 pessoas: um credor, dois devedores', () => {
    const b = { ana: 6000, bia: -2000, caio: -4000 }
    const t = suggestSettlements(b)
    expect(t).toEqual([
      { from: 'caio', to: 'ana', amountCents: 4000 },
      { from: 'bia', to: 'ana', amountCents: 2000 },
    ])
    expect(allZero(apply(b, t))).toBe(true)
  })

  it('3 pessoas: dois credores, um devedor', () => {
    const b = { ana: 1000, bia: 3000, caio: -4000 }
    expect(suggestSettlements(b)).toEqual([
      { from: 'caio', to: 'bia', amountCents: 3000 },
      { from: 'caio', to: 'ana', amountCents: 1000 },
    ])
  })

  it('5 pessoas: no máximo n − 1 transferências e tudo zera', () => {
    const b = { a: 10000, b: 4500, c: -3000, d: -6500, e: -5000 }
    const t = suggestSettlements(b)
    expect(t.length).toBeLessThanOrEqual(4)
    expect(allZero(apply(b, t))).toBe(true)
    // guloso: maior devedor (d, 6500) paga ao maior credor (a, 10000) primeiro
    expect(t[0]).toEqual({ from: 'd', to: 'a', amountCents: 6500 })
  })

  it('re-escolhe o maior a cada passo (não só ordena uma vez)', () => {
    // após d→a 6500, a fica com 3500 < b 4500: o próximo par deve ser e→b, não e→a
    const b = { a: 10000, b: 4500, c: -3000, d: -6500, e: -5000 }
    expect(suggestSettlements(b)[1]).toEqual({ from: 'e', to: 'b', amountCents: 4500 })
  })

  it('saldos de 1 centavo', () => {
    expect(suggestSettlements({ a: 1, b: -1 })).toEqual([{ from: 'b', to: 'a', amountCents: 1 }])
    const b = { a: 2, b: -1, c: -1 }
    const t = suggestSettlements(b)
    expect(t).toEqual([
      { from: 'b', to: 'a', amountCents: 1 },
      { from: 'c', to: 'a', amountCents: 1 },
    ])
    expect(allZero(apply(b, t))).toBe(true)
  })

  it('1 centavo de sobra de uma divisão de R$ 100,00 por 3', () => {
    // ana pagou 10000 dividido entre ana, bia, caio: 3334/3333/3333
    const b = { ana: 10000 - 3334, bia: -3333, caio: -3333 }
    const t = suggestSettlements(b)
    expect(t.reduce((s, x) => s + x.amountCents, 0)).toBe(6666)
    expect(allZero(apply(b, t))).toBe(true)
  })

  it('determinístico em empates (desempata pelo id)', () => {
    const b = { z: 100, y: 100, x: -100, w: -100 }
    expect(suggestSettlements(b)).toEqual([
      { from: 'w', to: 'y', amountCents: 100 },
      { from: 'x', to: 'z', amountCents: 100 },
    ])
  })

  it('não altera o objeto de entrada', () => {
    const b = { a: 100, b: -100 }
    suggestSettlements(b)
    expect(b).toEqual({ a: 100, b: -100 })
  })

  it('propriedade: zera todos os saldos com ≤ n − 1 transferências positivas (1000 casos)', () => {
    const r = rng(2024)
    for (let k = 0; k < 1000; k++) {
      const n = r.int(2, 10)
      const b: Record<string, number> = {}
      let total = 0
      for (let i = 0; i < n - 1; i++) {
        const v = r.int(-50_000, 50_000)
        b[`p${i}`] = v
        total += v
      }
      b[`p${n - 1}`] = -total // soma 0
      const nonZero = Object.values(b).filter((v) => v !== 0).length
      const t = suggestSettlements(b)
      expect(allZero(apply(b, t))).toBe(true)
      expect(t.length).toBeLessThanOrEqual(Math.max(0, nonZero - 1))
      expect(t.every((x) => x.amountCents > 0 && x.from !== x.to)).toBe(true)
    }
  })
})
