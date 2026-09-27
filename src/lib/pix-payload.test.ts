import { describe, expect, it } from 'vitest'
import {
  PIX_DEFAULT_CITY,
  buildPixPayload,
  crc16,
  emvField,
  emvFields,
  formatPixAmount,
  hasValidCrc,
  parseEmv,
  sanitizeEmvText,
  withCrc,
} from './pix-payload'

/**
 * Exemplo de BR Code estático do Manual de Padrões para Iniciação do Pix (Banco Central).
 * Chave aleatória, sem valor, nome "Fulano de Tal", cidade "BRASILIA", txid "***".
 * Fonte: https://www.bcb.gov.br/content/estabilidadefinanceira/pix/Regulamento_Pix/II_ManualdePadroesparaIniciacaodoPix.pdf
 * (atenção: a chave é 123e4567-e12**b**-..., não e12d).
 */
const BCB_REFERENCE =
  '00020126580014br.gov.bcb.pix0136123e4567-e12b-12d1-a456-4266554400005204000053039865802BR5913Fulano de Tal6008BRASILIA62070503***63041D3D'

/** CRC16-CCITT-FALSE por tabela: implementação independente para conferir a do app. */
function crc16Table(s: string): string {
  const table = Array.from({ length: 256 }, (_, n) => {
    let c = n << 8
    for (let k = 0; k < 8; k++) c = c & 0x8000 ? (c << 1) ^ 0x1021 : c << 1
    return c & 0xffff
  })
  let crc = 0xffff
  for (const b of new TextEncoder().encode(s)) crc = ((crc << 8) ^ table[((crc >> 8) ^ b) & 0xff]!) & 0xffff
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

describe('crc16 (CCITT-FALSE)', () => {
  it('vetor de teste padrão: "123456789" → 29B1', () => {
    expect(crc16('123456789')).toBe('29B1')
  })
  it('string vazia → FFFF (init sem XOR final)', () => {
    expect(crc16('')).toBe('FFFF')
  })
  it('hex maiúsculo com 4 dígitos (zero à esquerda)', () => {
    for (const s of ['a', 'pix', '000201', 'Racha Aí']) expect(crc16(s)).toMatch(/^[0-9A-F]{4}$/)
  })
  it('bate com a implementação por tabela', () => {
    for (const s of ['', 'a', '123456789', BCB_REFERENCE.slice(0, -4), 'x'.repeat(300)]) {
      expect(crc16(s)).toBe(crc16Table(s))
    }
  })
})

describe('payload de referência do BCB', () => {
  it('withCrc reproduz exatamente o exemplo oficial (CRC 1D3D)', () => {
    expect(withCrc(BCB_REFERENCE.slice(0, -8))).toBe(BCB_REFERENCE)
  })
  it('hasValidCrc aceita o exemplo e rejeita adulteração', () => {
    expect(hasValidCrc(BCB_REFERENCE)).toBe(true)
    expect(hasValidCrc(BCB_REFERENCE.replace('Fulano', 'Ciclano'))).toBe(false)
    expect(hasValidCrc(BCB_REFERENCE.slice(0, -1) + 'E')).toBe(false)
  })
  it('buildPixPayload gera a mesma estrutura, campo a campo', () => {
    const p = buildPixPayload({
      key: '123e4567-e12b-12d1-a456-426655440000',
      name: 'Fulano de Tal',
      city: 'BRASILIA',
    })
    // única diferença: o nome sai em maiúsculas (regra do app)
    const expectedBody = BCB_REFERENCE.slice(0, -8).replace('Fulano de Tal', 'FULANO DE TAL')
    expect(p).toBe(expectedBody + '6304' + crc16Table(expectedBody + '6304'))
    expect(hasValidCrc(p)).toBe(true)
  })
})

describe('emvField', () => {
  it('ID + tamanho com 2 dígitos + valor', () => {
    expect(emvField('00', '01')).toBe('000201')
    expect(emvField('59', 'FULANO')).toBe('5906FULANO')
    expect(emvField('26', 'x'.repeat(99))).toBe('2699' + 'x'.repeat(99))
  })
  it('rejeita campo > 99', () => {
    expect(() => emvField('26', 'x'.repeat(100))).toThrow()
  })
})

describe('formatPixAmount', () => {
  it.each([
    [4500, '45.00'],
    [1, '0.01'],
    [12750, '127.50'],
    [9999999, '99999.99'],
  ])('%i → %s', (c, s) => expect(formatPixAmount(c)).toBe(s))
})

describe('sanitizeEmvText', () => {
  it('sem acento, maiúsculo, cortado', () => {
    expect(sanitizeEmvText('Théo Martins', 25)).toBe('THEO MARTINS')
    expect(sanitizeEmvText('São Paulo', 15)).toBe('SAO PAULO')
    expect(sanitizeEmvText('Ana Clara Figueiredo Gonçalves', 25)).toBe('ANA CLARA FIGUEIREDO GONC')
    expect(sanitizeEmvText('Florianópolis de Santa Catarina', 15)).toBe('FLORIANOPOLIS D')
    expect(sanitizeEmvText("D'Ávila   & Cia.", 25)).toBe('D AVILA CIA')
  })
})

describe('buildPixPayload', () => {
  const base = { key: '+5548998123344', name: 'Ana Clara', amountCents: 6720, txid: 'RACHAg1abc' }

  it('campos obrigatórios e valores', () => {
    const p = buildPixPayload(base)
    const f = parseEmv(p)
    expect(f['00']).toBe('01')
    expect(parseEmv(f['26']!)).toEqual({ '00': 'br.gov.bcb.pix', '01': '+5548998123344' })
    expect(f['52']).toBe('0000')
    expect(f['53']).toBe('986')
    expect(f['54']).toBe('67.20')
    expect(f['58']).toBe('BR')
    expect(f['59']).toBe('ANA CLARA')
    expect(f['60']).toBe(PIX_DEFAULT_CITY)
    expect(parseEmv(f['62']!)).toEqual({ '05': 'RACHAg1abc' })
    expect(f['63']).toMatch(/^[0-9A-F]{4}$/)
    expect(hasValidCrc(p)).toBe(true)
  })

  it('campos na ordem certa, CRC por último', () => {
    const ids = emvFields(buildPixPayload(base)).map(([id]) => id)
    expect(ids).toEqual(['00', '26', '52', '53', '54', '58', '59', '60', '62', '63'])
    expect(buildPixPayload(base).slice(-8, -4)).toBe('6304')
  })

  it('sem valor → sem campo 54', () => {
    expect(parseEmv(buildPixPayload({ ...base, amountCents: 0 }))['54']).toBeUndefined()
  })

  it('txid: só alfanumérico, até 25; vazio vira ***', () => {
    expect(parseEmv(parseEmv(buildPixPayload({ ...base, txid: 'racha-ai_g1/2026' }))['62']!)['05']).toBe('rachaaig12026')
    expect(parseEmv(parseEmv(buildPixPayload({ ...base, txid: 'x'.repeat(40) }))['62']!)['05']).toBe('x'.repeat(25))
    expect(parseEmv(parseEmv(buildPixPayload({ ...base, txid: undefined }))['62']!)['05']).toBe('***')
    expect(parseEmv(parseEmv(buildPixPayload({ ...base, txid: '---' }))['62']!)['05']).toBe('***')
  })

  it('nome com acento e longo', () => {
    const f = parseEmv(buildPixPayload({ ...base, name: 'Gabriela Nunes de Albuquerque Júnior' }))
    expect(f['59']).toBe('GABRIELA NUNES DE ALBUQUE')
    expect(f['59']!.length).toBeLessThanOrEqual(25)
  })

  it('chave e-mail do tamanho máximo ainda cabe no campo 26', () => {
    const key = `${'a'.repeat(67)}@gmail.com` // 77 chars
    const f = parseEmv(buildPixPayload({ ...base, key }))
    expect(parseEmv(f['26']!)['01']).toBe(key)
  })

  it('chave vazia é erro', () => {
    expect(() => buildPixPayload({ ...base, key: '' })).toThrow()
  })
})
