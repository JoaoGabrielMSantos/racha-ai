/** Traduz erros do Supabase/rede para mensagens curtas em pt-BR, no tom do app. */
export function friendlyError(err: unknown): string {
  const e = (err ?? {}) as { code?: string; status?: number; message?: string; name?: string }
  const code = e.code ?? ''
  const msg = e.message ?? ''

  if (e.name === 'TypeError' && /fetch|network/i.test(msg)) return 'Sem conexão. Confere a internet e tenta de novo.'
  if (/Failed to fetch|NetworkError|Load failed/i.test(msg)) return 'Sem conexão. Confere a internet e tenta de novo.'

  switch (code) {
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return 'Muitos pedidos seguidos. Espera um minutinho e tenta de novo.'
    case 'otp_expired':
      return 'Esse código expirou ou não confere. Pede um novo.'
    case 'email_address_invalid':
    case 'validation_failed':
      return 'Esse e-mail não parece válido.'
    case 'email_address_not_authorized':
      return 'Esse e-mail não pode receber mensagens agora. Tenta outro.'
    case '23514': // check_violation — mensagens do banco já estão em pt-BR
    case 'P0001':
      return msg || 'Não deu pra salvar. Confere os dados.'
    case '42501':
      return 'Você não tem permissão pra fazer isso.'
  }
  if (e.status === 429) return 'Muitos pedidos seguidos. Espera um minutinho e tenta de novo.'
  if (/token has expired|invalid/i.test(msg) && /otp|token/i.test(msg)) return 'Esse código expirou ou não confere. Pede um novo.'
  return 'Deu ruim aqui. Tenta de novo?'
}
