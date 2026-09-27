/**
 * BR Code estático (Pix copia e cola), no formato EMV-MPM do Banco Central.
 * Cada campo = ID (2) + tamanho (2, com zero à esquerda) + valor.
 */

/** O app não coleta cidade; o campo 60 é obrigatório, então usamos um padrão. */
export const PIX_DEFAULT_CITY = 'SAO PAULO'

const GUI = 'br.gov.bcb.pix'

export function emvField(id: string, value: string): string {
  if (!/^\d{2}$/.test(id)) throw new Error(`ID EMV inválido: ${id}`)
  if (value.length > 99) throw new Error(`Campo ${id} passa de 99 caracteres`)
  return id + String(value.length).padStart(2, '0') + value
}

/** CRC16-CCITT-FALSE: poly 0x1021, init 0xFFFF, sem reflexão, sem XOR final. */
export function crc16(input: string): string {
  let crc = 0xffff
  for (const byte of new TextEncoder().encode(input)) {
    crc ^= byte << 8
    for (let i = 0; i < 8; i++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

/** Anexa o campo 63 (CRC calculado sobre o payload inteiro, incluindo "6304"). */
export function withCrc(payloadWithoutCrc: string): string {
  const base = payloadWithoutCrc + '6304'
  return base + crc16(base)
}

/** Sem acentos, maiúsculo, só A-Z/0-9/espaço, espaços colapsados, cortado em `max`. */
export function sanitizeEmvText(text: string, max: number): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, max)
    .trim()
}

/** txid: alfanumérico, até 25; vazio vira "***" (sem identificador). */
export function sanitizeTxid(txid: string | undefined): string {
  const t = (txid ?? '').replace(/[^A-Za-z0-9]/g, '').slice(0, 25)
  return t || '***'
}

export type PixPayloadInput = {
  /** Chave já normalizada (ver normalizePixKey). */
  key: string
  name: string
  city?: string
  /** Omitido ou 0 → sem campo 54 (quem paga digita o valor). */
  amountCents?: number
  txid?: string
}

export function formatPixAmount(cents: number): string {
  if (!Number.isSafeInteger(cents) || cents < 0) throw new RangeError('amountCents precisa ser inteiro ≥ 0')
  return `${Math.floor(cents / 100)}.${String(cents % 100).padStart(2, '0')}`
}

export function buildPixPayload({ key, name, city = PIX_DEFAULT_CITY, amountCents, txid }: PixPayloadInput): string {
  if (!key) throw new Error('Chave Pix vazia')
  const merchantName = sanitizeEmvText(name, 25) || 'RACHA AI'
  const merchantCity = sanitizeEmvText(city, 15) || PIX_DEFAULT_CITY

  const payload =
    emvField('00', '01') +
    emvField('26', emvField('00', GUI) + emvField('01', key)) +
    emvField('52', '0000') +
    emvField('53', '986') +
    (amountCents ? emvField('54', formatPixAmount(amountCents)) : '') +
    emvField('58', 'BR') +
    emvField('59', merchantName) +
    emvField('60', merchantCity) +
    emvField('62', emvField('05', sanitizeTxid(txid)))

  return withCrc(payload)
}

/** Lê um payload EMV (TLV) como lista ordenada de [id, valor]. */
export function emvFields(payload: string): Array<[string, string]> {
  const out: Array<[string, string]> = []
  let i = 0
  while (i < payload.length) {
    const id = payload.slice(i, i + 2)
    const lenText = payload.slice(i + 2, i + 4)
    if (!/^\d{2}$/.test(id) || !/^\d{2}$/.test(lenText)) throw new Error(`TLV inválido na posição ${i}`)
    const len = Number(lenText)
    if (i + 4 + len > payload.length) throw new Error(`Campo ${id} passa do fim do payload`)
    out.push([id, payload.slice(i + 4, i + 4 + len)])
    i += 4 + len
  }
  return out
}

/** Mesmo que emvFields, como objeto (a ordem das chaves não é garantida). */
export function parseEmv(payload: string): Record<string, string> {
  return Object.fromEntries(emvFields(payload))
}

/** Confere o CRC do campo 63. */
export function hasValidCrc(payload: string): boolean {
  const idx = payload.length - 8
  if (idx < 0 || payload.slice(idx, idx + 4) !== '6304') return false
  return crc16(payload.slice(0, idx + 4)) === payload.slice(idx + 4)
}
