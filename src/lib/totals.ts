/** Totais da Home: soma dos meus saldos positivos (a receber) e negativos (a pagar), em centavos. */
export function homeTotals(groups: readonly { myBalanceCents: number }[]): { receive: number; pay: number } {
  let receive = 0
  let pay = 0
  for (const g of groups) {
    if (g.myBalanceCents > 0) receive += g.myBalanceCents
    else pay -= g.myBalanceCents
  }
  return { receive, pay }
}
