/** Iniciais do avatar: primeira letra do 1º e do último nome. */
export function initialsOf(name: string): string {
  const w = name.trim().split(/\s+/).filter(Boolean)
  if (!w.length) return '?'
  const first = w[0]!.charAt(0)
  const last = w.length > 1 ? w[w.length - 1]!.charAt(0) : ''
  return (first + last).toUpperCase()
}

export function balanceCaption(amount: number): string | null {
  return amount > 0 ? 'a receber' : amount < 0 ? 'a pagar' : null
}

export function plural(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`
}

export function groupMeta(memberCount: number, expenseCount: number): string {
  return `${plural(memberCount, 'membro', 'membros')} · ${plural(expenseCount, 'gasto', 'gastos')}`
}
