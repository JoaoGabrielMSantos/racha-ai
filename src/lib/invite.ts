/**
 * Convite pendente: /c/:code sem sessão guarda o code aqui e manda para /login.
 * Depois do login (e do onboarding, se preciso) o app chama join_group e abre o grupo.
 *
 * sessionStorage vale só na aba atual. Para o link mágico (que abre uma aba nova),
 * o emailRedirectTo já aponta para /c/:code — ver pendingRedirectPath().
 */
const KEY = 'racha-pending-invite'

export function savePendingInvite(code: string) {
  try {
    sessionStorage.setItem(KEY, code)
  } catch {
    // storage indisponível: o convite se perde, mas o link continua funcionando
  }
}

export function peekPendingInvite(): string | null {
  try {
    return sessionStorage.getItem(KEY)
  } catch {
    return null
  }
}

export function clearPendingInvite() {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    // ignore
  }
}

/** Para onde o link mágico deve levar: o convite pendente, senão a página de origem. */
export function magicLinkRedirect(origin: string, fromPath: string | undefined): string {
  const code = peekPendingInvite()
  if (code) return `${origin}/c/${encodeURIComponent(code)}`
  return `${origin}${fromPath && fromPath.startsWith('/') ? fromPath : '/'}`
}
