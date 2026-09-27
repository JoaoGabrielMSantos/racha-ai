export type Share = { userId: string; amountCents: number }

/**
 * Divide `amountCents` igualmente entre `userIds`.
 * base = floor(total / n); os primeiros (total − base·n) recebem +1 centavo.
 * A soma das partes é sempre exatamente `amountCents`.
 */
export function splitEqually(amountCents: number, userIds: readonly string[]): Share[] {
  if (!Number.isSafeInteger(amountCents) || amountCents < 0) {
    throw new RangeError('amountCents precisa ser um inteiro ≥ 0')
  }
  const n = userIds.length
  if (n === 0) return []
  const base = Math.floor(amountCents / n)
  const remainder = amountCents - base * n
  return userIds.map((userId, i) => ({ userId, amountCents: base + (i < remainder ? 1 : 0) }))
}

export function sumShares(shares: readonly Share[]): number {
  return shares.reduce((acc, s) => acc + s.amountCents, 0)
}
