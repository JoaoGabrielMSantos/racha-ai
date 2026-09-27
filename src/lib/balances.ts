export type ExpenseLike = { id: string; paid_by: string; amount_cents: number }
export type SplitLike = { expense_id: string; user_id: string; amount_cents: number }
export type SettlementLike = { from_user: string; to_user: string; amount_cents: number }

/** Saldo por usuário, em centavos. Positivo = tem a receber; negativo = deve. */
export type Balances = Record<string, number>

/**
 * +amount para quem pagou, −share para cada participante.
 * Settlement (from pagou to): from += amount, to −= amount.
 * Se os splits de cada gasto somam o valor do gasto, a soma dos saldos é sempre 0.
 *
 * `memberIds` (opcional) garante uma entrada 0 para quem ainda não tem movimento.
 */
export function computeBalances(
  expenses: readonly ExpenseLike[],
  splits: readonly SplitLike[],
  settlements: readonly SettlementLike[],
  memberIds: readonly string[] = [],
): Balances {
  const b: Balances = {}
  const add = (id: string, v: number) => {
    b[id] = (b[id] ?? 0) + v
  }
  for (const id of memberIds) b[id] = 0
  for (const e of expenses) add(e.paid_by, e.amount_cents)
  for (const s of splits) add(s.user_id, -s.amount_cents)
  for (const t of settlements) {
    add(t.from_user, t.amount_cents)
    add(t.to_user, -t.amount_cents)
  }
  // normaliza -0
  for (const id of Object.keys(b)) if (b[id] === 0) b[id] = 0
  return b
}
