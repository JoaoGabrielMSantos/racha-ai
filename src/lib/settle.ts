import type { Balances } from './balances'

export type Transfer = { from: string; to: string; amountCents: number }

type Entry = { id: string; v: number }

/** Maior valor; empate desfeito pelo menor id (resultado determinístico). */
function pickLargest(list: Entry[]): Entry | undefined {
  let best: Entry | undefined
  for (const e of list) {
    if (e.v <= 0) continue
    if (!best || e.v > best.v || (e.v === best.v && e.id < best.id)) best = e
  }
  return best
}

/**
 * Acertos sugeridos, pelo algoritmo guloso: a cada passo casa o maior devedor com o
 * maior credor, transfere o mínimo entre os dois e repete até zerar.
 *
 * Cada passo zera pelo menos uma pessoa, então são no máximo n − 1 transferências
 * para n pessoas com saldo ≠ 0. Reduz o número de transferências, mas NÃO garante o
 * mínimo absoluto: achar o mínimo é NP-difícil.
 */
export function suggestSettlements(balances: Balances): Transfer[] {
  const creditors: Entry[] = []
  const debtors: Entry[] = []
  for (const [id, v] of Object.entries(balances)) {
    if (v > 0) creditors.push({ id, v })
    else if (v < 0) debtors.push({ id, v: -v })
  }

  const out: Transfer[] = []
  for (;;) {
    const d = pickLargest(debtors)
    const c = pickLargest(creditors)
    if (!d || !c) break
    const x = Math.min(d.v, c.v)
    out.push({ from: d.id, to: c.id, amountCents: x })
    d.v -= x
    c.v -= x
  }
  return out
}
