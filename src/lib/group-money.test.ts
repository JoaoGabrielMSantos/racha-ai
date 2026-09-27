import { describe, expect, it } from 'vitest'
import {
  askPixKeyMessage,
  balanceBar,
  balanceCaptionLong,
  groupMoney,
  myBalanceLabel,
  pixTxid,
  reminderMessage,
} from './group-money'
import { sanitizeTxid } from './pix-payload'

describe('groupMoney', () => {
  it('saldos + acertos a partir do formato da API', () => {
    const { balances, pending } = groupMoney(
      [
        {
          id: 'e1',
          paidBy: 'ana',
          amountCents: 9000,
          splits: [
            { userId: 'ana', amountCents: 3000 },
            { userId: 'bia', amountCents: 3000 },
            { userId: 'me', amountCents: 3000 },
          ],
        },
      ],
      [{ fromUser: 'bia', toUser: 'ana', amountCents: 3000 }],
      ['me', 'ana', 'bia', 'caio'],
    )
    expect(balances).toEqual({ me: -3000, ana: 3000, bia: 0, caio: 0 })
    expect(pending).toEqual([{ from: 'me', to: 'ana', amountCents: 3000 }])
  })
})

describe('balanceBar', () => {
  it('eixo central: maior saldo ocupa 50%', () => {
    expect(balanceBar(5000, 5000)).toEqual({ side: 'right', widthPct: 50 })
    expect(balanceBar(-2500, 5000)).toEqual({ side: 'left', widthPct: 25 })
    expect(balanceBar(0, 0)).toEqual({ side: 'right', widthPct: 0 })
  })
})

describe('textos', () => {
  it('legendas e rótulo do meu saldo', () => {
    expect([balanceCaptionLong(1), balanceCaptionLong(-1), balanceCaptionLong(0)]).toEqual([
      'tem a receber',
      'deve pro grupo',
      'tá quite',
    ])
    expect([myBalanceLabel(1), myBalanceLabel(-1), myBalanceLabel(0)]).toEqual([
      'Você tem a receber',
      'Você deve no grupo',
      'Você tá quite',
    ])
  })
  it('lembrete do WhatsApp (texto da spec)', () => {
    expect(reminderMessage('Bia', 6720, 'Viagem Floripa', 'https://x.app/g/1')).toBe(
      'Oi Bia! Bora acertar os R$ 67,20 do Viagem Floripa no Racha Aí? https://x.app/g/1',
    )
    expect(askPixKeyMessage('Ana', 100, 'Rolê', 'https://x.app/g/1')).toContain('ainda não cadastrou sua chave Pix')
  })
})

describe('pixTxid', () => {
  it('alfanumérico, ≤ 25 e estável', () => {
    const t = pixTxid('0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d', 'ffffffff-1111-4222-8333-444444444444')
    expect(t).toMatch(/^[A-Za-z0-9]{1,25}$/)
    expect(t).toBe(pixTxid('0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d', 'ffffffff-1111-4222-8333-444444444444'))
    expect(sanitizeTxid(t)).toBe(t)
  })
})
