import { describe, expect, it } from 'vitest'
import { computeBalances, type ExpenseLike, type SettlementLike, type SplitLike } from './balances'
import { splitEqually } from './split'
import { rng } from './test-utils'

const sum = (b: Record<string, number>) => Object.values(b).reduce((a, v) => a + v, 0)

function expense(id: string, paidBy: string, amount: number, ids: string[]) {
  const e: ExpenseLike = { id, paid_by: paidBy, amount_cents: amount }
  const s: SplitLike[] = splitEqually(amount, ids).map((x) => ({ expense_id: id, user_id: x.userId, amount_cents: x.amountCents }))
  return { e, s }
}

describe('computeBalances', () => {
  it('quem paga fica positivo, quem participa fica negativo', () => {
    const { e, s } = expense('e1', 'ana', 10000, ['ana', 'bia'])
    expect(computeBalances([e], s, [])).toEqual({ ana: 5000, bia: -5000 })
  })

  it('settlement: from += amount, to −= amount', () => {
    const { e, s } = expense('e1', 'ana', 10000, ['ana', 'bia'])
    const t: SettlementLike[] = [{ from_user: 'bia', to_user: 'ana', amount_cents: 5000 }]
    expect(computeBalances([e], s, t)).toEqual({ ana: 0, bia: 0 })
  })

  it('pagamento parcial', () => {
    const { e, s } = expense('e1', 'ana', 10000, ['ana', 'bia'])
    const t: SettlementLike[] = [{ from_user: 'bia', to_user: 'ana', amount_cents: 2000 }]
    expect(computeBalances([e], s, t)).toEqual({ ana: 3000, bia: -3000 })
  })

  it('quem paga e não participa', () => {
    const { e, s } = expense('e1', 'ana', 9000, ['bia', 'caio', 'duda'])
    expect(computeBalances([e], s, [])).toEqual({ ana: 9000, bia: -3000, caio: -3000, duda: -3000 })
  })

  it('memberIds garante entrada 0 pra quem não tem movimento', () => {
    expect(computeBalances([], [], [], ['ana', 'bia'])).toEqual({ ana: 0, bia: 0 })
  })

  it('protótipo: Viagem Floripa', () => {
    const a1 = ['me', 'ana', 'bia', 'caio']
    const xs = [
      expense('e1', 'ana', 184000, a1),
      expense('e2', 'caio', 26000, a1),
      expense('e3', 'me', 31240, a1),
      expense('e4', 'me', 48600, a1),
      expense('e5', 'bia', 36000, ['me', 'ana', 'bia']),
      expense('e6', 'ana', 8400, a1),
    ]
    const b = computeBalances(
      xs.map((x) => x.e),
      xs.flatMap((x) => x.s),
      [],
    )
    expect(sum(b)).toBe(0)
    // me: pagou 79840; partes 46000+6500+7810+12150+12000+2100 = 86560 → −6720 (o "R$ 67,20" do modal Pix)
    expect(b.me).toBe(-6720)
  })

  it('propriedade: a soma dos saldos é sempre 0 (500 grupos aleatórios)', () => {
    const r = rng(7)
    const people = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']
    for (let k = 0; k < 500; k++) {
      const members = people.slice(0, r.int(2, people.length))
      const exps: ExpenseLike[] = []
      const splits: SplitLike[] = []
      for (let i = 0; i < r.int(0, 15); i++) {
        const { e, s } = expense(`e${i}`, r.pick(members), r.int(1, 5_000_00), r.subset(members))
        exps.push(e)
        splits.push(...s)
      }
      const sets: SettlementLike[] = []
      for (let i = 0; i < r.int(0, 5); i++) {
        const from = r.pick(members)
        const to = r.pick(members.filter((m) => m !== from))
        sets.push({ from_user: from, to_user: to, amount_cents: r.int(1, 100_00) })
      }
      expect(sum(computeBalances(exps, splits, sets, members))).toBe(0)
    }
  })
})
