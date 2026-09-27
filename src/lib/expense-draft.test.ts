import { describe, expect, it } from 'vitest'
import {
  blankDraft,
  draftFromExpense,
  draftInvalidReason,
  draftRemainder,
  draftShares,
  remainderText,
  toSavePayload,
  type ExpenseDraft,
} from './expense-draft'

const TODAY = '2026-09-27'
const M = ['me', 'ana', 'bia', 'caio']
const base = (p: Partial<ExpenseDraft> = {}): ExpenseDraft => ({ ...blankDraft(M, 'me', TODAY), ...p })

describe('draftShares', () => {
  it('igual pra todos: R$ 100,00 / 4 = 25,00', () => {
    expect(draftShares(base({ digits: '10000' }), M).map((s) => s.amountCents)).toEqual([2500, 2500, 2500, 2500])
  })
  it('só alguns: divide entre os marcados e zera o resto', () => {
    const d = base({ digits: '12750', mode: 'some', selected: ['me', 'ana', 'bia'] })
    expect(draftShares(d, M).map((s) => s.amountCents)).toEqual([4250, 4250, 4250, 0])
  })
  it('por valor: lê o texto de cada um', () => {
    const d = base({ digits: '10000', mode: 'amount', custom: { me: '50', ana: '25,5', bia: '24,50' } })
    expect(draftShares(d, M).map((s) => s.amountCents)).toEqual([5000, 2550, 2450, 0])
  })
})

describe('draftRemainder / remainderText', () => {
  it('faltam, passou, fechou', () => {
    expect(draftRemainder(base({ digits: '10000', mode: 'amount', custom: { me: '60' } }), M)).toBe(4000)
    expect(remainderText(4000)).toBe('Faltam R$ 40,00 pra fechar')
    expect(remainderText(-150)).toBe('Passou R$ 1,50 do total')
    expect(remainderText(0)).toBe('Fechou certinho')
  })
})

describe('draftInvalidReason (ordem do design)', () => {
  it('sem valor', () => {
    expect(draftInvalidReason(base(), M)).toBe('Coloca o valor do gasto')
  })
  it('sem descrição', () => {
    expect(draftInvalidReason(base({ digits: '500', description: '   ' }), M)).toBe('Falta a descrição')
  })
  it('só alguns sem ninguém marcado', () => {
    expect(draftInvalidReason(base({ digits: '500', description: 'Pizza', mode: 'some', selected: [] }), M)).toBe(
      'Escolhe quem participa',
    )
  })
  it('por valor que não fecha', () => {
    expect(
      draftInvalidReason(base({ digits: '500', description: 'Pizza', mode: 'amount', custom: { me: '4,99' } }), M),
    ).toBe('Os valores não fecham')
  })
  it('válido', () => {
    expect(draftInvalidReason(base({ digits: '500', description: 'Pizza' }), M)).toBeNull()
    expect(
      draftInvalidReason(base({ digits: '500', description: 'Pizza', mode: 'amount', custom: { me: '5' } }), M),
    ).toBeNull()
  })
})

describe('toSavePayload', () => {
  it('monta o payload da RPC, sem partes zeradas, com a data escolhida', () => {
    const d = base({
      digits: '12750',
      description: '  Pizza no Chico ',
      mode: 'some',
      selected: ['me', 'ana', 'bia'],
      dateChoice: 'yesterday',
    })
    expect(toSavePayload(d, M, 'g1', undefined, TODAY)).toEqual({
      group_id: 'g1',
      description: 'Pizza no Chico',
      amount_cents: 12750,
      paid_by: 'me',
      split_mode: 'some',
      expense_date: '2026-09-26',
      splits: [
        { user_id: 'me', amount_cents: 4250 },
        { user_id: 'ana', amount_cents: 4250 },
        { user_id: 'bia', amount_cents: 4250 },
      ],
    })
  })
  it('edição leva o id; a soma das partes bate com o valor', () => {
    const p = toSavePayload(base({ digits: '10000', description: 'X' }), ['a', 'b', 'c'], 'g1', 'e9', TODAY)
    expect(p.id).toBe('e9')
    expect(p.splits.reduce((s, x) => s + x.amount_cents, 0)).toBe(10000)
  })
})

describe('draftFromExpense (Editar)', () => {
  it('reconstrói o formulário a partir do gasto salvo', () => {
    const d = draftFromExpense(
      {
        amountCents: 10000,
        description: 'Mercado',
        paidBy: 'ana',
        splitMode: 'amount',
        expenseDate: '2026-09-16',
        splits: [
          { userId: 'me', amountCents: 7550 },
          { userId: 'ana', amountCents: 2450 },
        ],
      },
      M,
      TODAY,
    )
    expect(d).toMatchObject({
      digits: '10000',
      paidBy: 'ana',
      mode: 'amount',
      selected: ['me', 'ana'],
      custom: { me: '75,50', ana: '24,50' },
      dateChoice: 'other',
      otherDate: '2026-09-16',
    })
    expect(draftInvalidReason(d, M)).toBeNull()
  })
  it('hoje / ontem viram os chips', () => {
    const e = { amountCents: 1, description: 'x', paidBy: 'me', splitMode: 'equal' as const, splits: [] }
    expect(draftFromExpense({ ...e, expenseDate: TODAY }, M, TODAY).dateChoice).toBe('today')
    expect(draftFromExpense({ ...e, expenseDate: '2026-09-26' }, M, TODAY).dateChoice).toBe('yesterday')
  })
})
