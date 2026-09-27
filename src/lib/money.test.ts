import { describe, expect, it } from 'vitest'
import { applyKeypadKey, formatAmount, formatBRL, formatSignedBRL, parseCentsInput, parseMoneyText, type KeypadKey } from './money'

const NBSP = ' '

describe('formatBRL', () => {
  it('formata centavos em reais pt-BR', () => {
    expect(formatBRL(4500)).toBe(`R$${NBSP}45,00`)
    expect(formatBRL(0)).toBe(`R$${NBSP}0,00`)
    expect(formatBRL(1)).toBe(`R$${NBSP}0,01`)
    expect(formatBRL(9999999)).toBe(`R$${NBSP}99.999,99`)
  })
  it('sinal tipográfico do design', () => {
    expect(formatSignedBRL(4500)).toBe(`+ R$${NBSP}45,00`)
    expect(formatSignedBRL(-4500)).toBe(`− R$${NBSP}45,00`)
    expect(formatSignedBRL(0)).toBe(`R$${NBSP}0,00`)
  })
  it('formatAmount sem símbolo', () => {
    expect(formatAmount(12750)).toBe('127,50')
    expect(formatAmount(0)).toBe('0,00')
  })
})

describe('teclado de centavos', () => {
  const type = (keys: KeypadKey[]) => keys.reduce(applyKeypadKey, '')

  it('dígitos entram pela direita: 1,2,7,5,0 → 127,50', () => {
    const d = type(['1', '2', '7', '5', '0'])
    expect(d).toBe('12750')
    expect(parseCentsInput(d)).toBe(12750)
  })
  it('descarta zeros à esquerda', () => {
    expect(type(['0', '0', '0'])).toBe('')
    expect(type(['00', '5'])).toBe('5')
  })
  it('máximo de 8 dígitos', () => {
    const d = type(['9', '9', '9', '9', '9', '9', '9', '9', '9'])
    expect(d).toBe('99999999')
    expect(applyKeypadKey('9999999', '00')).toBe('9999999')
  })
  it('backspace', () => {
    expect(applyKeypadKey('12750', 'backspace')).toBe('1275')
    expect(applyKeypadKey('', 'backspace')).toBe('')
  })
  it('parseCentsInput ignora lixo', () => {
    expect(parseCentsInput('')).toBe(0)
    expect(parseCentsInput('12a3')).toBe(123)
  })
})

describe('parseMoneyText', () => {
  it.each([
    ['12,50', 1250],
    ['12,5', 1250],
    ['12', 1200],
    ['1.234,56', 123456],
    ['12.50', 1250],
    ['1.234', 123400],
    ['R$ 0,01', 1],
    [',99', 99],
    ['', 0],
    ['abc', 0],
  ])('%s → %i', (input, cents) => {
    expect(parseMoneyText(input)).toBe(cents)
  })
})
