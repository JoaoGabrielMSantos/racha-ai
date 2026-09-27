/** Valores monetários são sempre centavos inteiros. Float só na hora de exibir. */

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const plain = new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

/** 4500 → "R$ 45,00" (com espaço não separável). Negativos: "-R$ 45,00". */
export function formatBRL(cents: number): string {
  return brl.format(cents / 100)
}

/** Valor absoluto formatado, para quando o sinal é mostrado à parte ("+ R$ 45,00" / "− R$ 45,00"). */
export function formatBRLAbs(cents: number): string {
  return formatBRL(Math.abs(cents))
}

/** Com sinal tipográfico do design: "+ R$ 45,00", "− R$ 45,00", "R$ 0,00". */
export function formatSignedBRL(cents: number): string {
  if (cents === 0) return formatBRL(0)
  return `${cents > 0 ? '+' : '−'} ${formatBRLAbs(cents)}`
}

/** 12750 → "127,50" (sem "R$"; usado no display do teclado). */
export function formatAmount(cents: number): string {
  return plain.format(Math.abs(cents) / 100)
}

export const MAX_AMOUNT_DIGITS = 8

export type KeypadKey = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '00' | 'backspace'

/**
 * Teclado de centavos: os dígitos entram pela direita.
 * "" + 1,2,7,5,0 → "12750" (= R$ 127,50). Zeros à esquerda são descartados; máximo 8 dígitos.
 */
export function applyKeypadKey(digits: string, key: KeypadKey): string {
  if (key === 'backspace') return digits.slice(0, -1)
  const next = (digits + key).replace(/^0+/, '')
  return next.length > MAX_AMOUNT_DIGITS ? digits : next
}

/** Dígitos do teclado → centavos. "" → 0. Ignora qualquer coisa que não seja dígito. */
export function parseCentsInput(digits: string): number {
  const d = digits.replace(/\D/g, '').slice(0, MAX_AMOUNT_DIGITS)
  return d ? Number.parseInt(d, 10) : 0
}

/**
 * Texto livre em reais → centavos. Aceita "12,5", "12,50", "1.234,56", "12.50", "12".
 * Retorna 0 para entrada vazia ou inválida. Nunca passa por float.
 */
export function parseMoneyText(text: string): number {
  const s = text.trim().replace(/\s|R\$/g, '')
  if (!s) return 0
  let intPart: string
  let frac = ''
  const comma = s.lastIndexOf(',')
  if (comma >= 0) {
    intPart = s.slice(0, comma).replace(/\./g, '')
    frac = s.slice(comma + 1)
  } else {
    const dot = s.lastIndexOf('.')
    // "12.50" é decimal; "1.234" (3 dígitos após o ponto) é milhar
    if (dot >= 0 && s.length - dot - 1 !== 3) {
      intPart = s.slice(0, dot).replace(/\./g, '')
      frac = s.slice(dot + 1)
    } else {
      intPart = s.replace(/\./g, '')
    }
  }
  if (!/^\d*$/.test(intPart) || !/^\d*$/.test(frac) || (!intPart && !frac)) return 0
  const cents = Number.parseInt((frac + '00').slice(0, 2), 10)
  return Number.parseInt(intPart || '0', 10) * 100 + cents
}
