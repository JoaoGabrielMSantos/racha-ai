/** Primeiro nome ("Ana Clara" → "Ana"). */
export function firstName(name: string | null | undefined): string {
  return (name ?? '').trim().split(/\s+/)[0] ?? ''
}

export type Person = { id: string; displayName: string | null; avatarHue: number }

/** Nome completo para Avatar (iniciais). Quem saiu do grupo e perdeu visibilidade vira "Ex-membro". */
export function fullName(p: Person | undefined): string {
  return p?.displayName?.trim() || 'Ex-membro'
}

/** Rótulo curto: "Você" para o próprio usuário, senão o primeiro nome. */
export function shortName(p: Person | undefined, meId: string): string {
  if (p && p.id === meId) return 'Você'
  return firstName(p?.displayName) || 'Ex-membro'
}
