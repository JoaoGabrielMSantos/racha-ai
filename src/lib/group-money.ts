import { computeBalances, type Balances } from './balances'
import { suggestSettlements, type Transfer } from './settle'
import { formatBRL } from './money'

type ExpenseIn = { id: string; paidBy: string; amountCents: number; splits: readonly { userId: string; amountCents: number }[] }
type SettlementIn = { fromUser: string; toUser: string; amountCents: number }

export type GroupMoney = { balances: Balances; pending: Transfer[] }

/** Saldos e acertos sugeridos de um grupo, a partir dos dados como vêm da API. */
export function groupMoney(
  expenses: readonly ExpenseIn[],
  settlements: readonly SettlementIn[],
  memberIds: readonly string[],
): GroupMoney {
  const balances = computeBalances(
    expenses.map((e) => ({ id: e.id, paid_by: e.paidBy, amount_cents: e.amountCents })),
    expenses.flatMap((e) => e.splits.map((s) => ({ expense_id: e.id, user_id: s.userId, amount_cents: s.amountCents }))),
    settlements.map((s) => ({ from_user: s.fromUser, to_user: s.toUser, amount_cents: s.amountCents })),
    memberIds,
  )
  return { balances, pending: suggestSettlements(balances) }
}

/**
 * Barra da aba Saldos: eixo no centro; positivo cresce para a direita, negativo para a esquerda.
 * Largura = |saldo| / maior |saldo| × 50%.
 */
export function balanceBar(value: number, maxAbs: number): { side: 'left' | 'right'; widthPct: number } {
  const max = Math.max(1, maxAbs)
  return { side: value >= 0 ? 'right' : 'left', widthPct: (Math.abs(value) / max) * 50 }
}

export function balanceCaptionLong(value: number): string {
  return value > 0 ? 'tem a receber' : value < 0 ? 'deve pro grupo' : 'tá quite'
}

export function myBalanceLabel(value: number): string {
  return value > 0 ? 'Você tem a receber' : value < 0 ? 'Você deve no grupo' : 'Você tá quite'
}

/** "Lembrar no WhatsApp" do credor para o devedor. */
export function reminderMessage(debtorFirstName: string, amountCents: number, groupName: string, groupLink: string): string {
  return `Oi ${debtorFirstName}! Bora acertar os ${formatBRL(amountCents)} do ${groupName} no Racha Aí? ${groupLink}`
}

/** Devedor pedindo a chave Pix para quem ainda não cadastrou. */
export function askPixKeyMessage(creditorFirstName: string, amountCents: number, groupName: string, groupLink: string): string {
  return `Oi ${creditorFirstName}! Quero te pagar os ${formatBRL(amountCents)} do ${groupName}, mas você ainda não cadastrou sua chave Pix no Racha Aí. Cadastra lá no Perfil? ${groupLink}`
}

/** txid do BR Code: alfanumérico ≤ 25, estável por (grupo, credor). */
export function pixTxid(groupId: string, creditorId: string): string {
  const hex = (s: string) => s.replace(/[^0-9a-f]/gi, '')
  return `RACHAAI${hex(groupId).slice(0, 9)}${hex(creditorId).slice(0, 9)}`.slice(0, 25)
}
