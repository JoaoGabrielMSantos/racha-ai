export type PixKeyType = 'cpf' | 'phone' | 'email' | 'random'

export type NormalizeResult = { ok: true; value: string } | { ok: false; error: string }

const ok = (value: string): NormalizeResult => ({ ok: true, value })
const fail = (error: string): NormalizeResult => ({ ok: false, error })

/** Dígitos verificadores do CPF (módulo 11). Rejeita sequências repetidas (000..., 111...). */
export function isValidCpf(digits: string): boolean {
  if (!/^\d{11}$/.test(digits) || /^(\d)\1{10}$/.test(digits)) return false
  const nums = [...digits].map(Number)
  const dv = (len: number) => {
    let sum = 0
    for (let i = 0; i < len; i++) sum += nums[i]! * (len + 1 - i)
    const r = (sum * 10) % 11
    return r === 10 ? 0 : r
  }
  return dv(9) === nums[9] && dv(10) === nums[10]
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const UUID_V4_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

/**
 * Normaliza a chave Pix para o formato gravado no banco (e usado no BR Code):
 * - cpf:    só dígitos, com dígitos verificadores válidos → "12345678909"
 * - phone:  +55 + DDD + número → "(48) 99812-3344" vira "+5548998123344"
 * - email:  trim + minúsculas
 * - random: UUID v4 (EVP), minúsculas
 * Erros em pt-BR, prontos para mostrar embaixo do campo.
 */
export function normalizePixKey(type: PixKeyType, raw: string): NormalizeResult {
  const input = raw.trim()
  if (!input) return fail('Preenche a chave Pix')

  switch (type) {
    case 'cpf': {
      if (/[^\d.\-\s]/.test(input)) return fail('CPF só tem números')
      const d = input.replace(/\D/g, '')
      if (d.length !== 11) return fail('CPF tem 11 dígitos')
      if (!isValidCpf(d)) return fail('Esse CPF não é válido. Confere os números?')
      return ok(d)
    }
    case 'phone': {
      if (/[^\d()+\-.\s]/.test(input)) return fail('Celular só tem números')
      let d = input.replace(/\D/g, '')
      // aceita com código do país (55) na frente
      if ((d.length === 12 || d.length === 13) && d.startsWith('55')) d = d.slice(2)
      if (d.length !== 10 && d.length !== 11) return fail('Coloca o DDD e o número, tipo (48) 99812-3344')
      if (!/^[1-9]{2}/.test(d)) return fail('Esse DDD não existe')
      if (d.length === 11 && d[2] !== '9') return fail('Celular com 9 dígitos começa com 9')
      return ok(`+55${d}`)
    }
    case 'email': {
      const e = input.toLowerCase()
      if (!EMAIL_RE.test(e)) return fail('Esse e-mail parece incompleto')
      if (e.length > 77) return fail('E-mail muito longo pra chave Pix (máx. 77)')
      return ok(e)
    }
    case 'random': {
      const u = input.toLowerCase()
      if (!UUID_V4_RE.test(u)) return fail('Chave aleatória inválida. Cola ela inteira, com os tracinhos')
      return ok(u)
    }
  }
}

/** Formata a chave normalizada para exibição ("Chave: ..."). */
export function formatPixKey(type: PixKeyType, key: string): string {
  if (type === 'cpf' && /^\d{11}$/.test(key)) {
    return `${key.slice(0, 3)}.${key.slice(3, 6)}.${key.slice(6, 9)}-${key.slice(9)}`
  }
  if (type === 'phone') {
    const m = /^\+55(\d{2})(\d{4,5})(\d{4})$/.exec(key)
    if (m) return `(${m[1]}) ${m[2]}-${m[3]}`
  }
  return key
}

export const PIX_KEY_LABELS: Record<PixKeyType, string> = {
  cpf: 'CPF',
  phone: 'Celular',
  email: 'E-mail',
  random: 'Aleatória',
}

export const PIX_KEY_PLACEHOLDERS: Record<PixKeyType, string> = {
  cpf: '000.000.000-00',
  phone: '(00) 00000-0000',
  email: 'voce@email.com',
  random: 'Cole sua chave aleatória',
}
