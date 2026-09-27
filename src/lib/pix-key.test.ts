import { describe, expect, it } from 'vitest'
import { formatPixKey, isValidCpf, normalizePixKey } from './pix-key'

describe('isValidCpf', () => {
  it.each(['52998224725', '11144477735', '12345678909'])('%s é válido', (cpf) => {
    expect(isValidCpf(cpf)).toBe(true)
  })
  it.each(['12345678910', '52998224724', '00000000000', '11111111111', '1234567890'])('%s é inválido', (cpf) => {
    expect(isValidCpf(cpf)).toBe(false)
  })
})

describe('normalizePixKey', () => {
  describe('cpf', () => {
    it('aceita com ou sem máscara e devolve só dígitos', () => {
      expect(normalizePixKey('cpf', '529.982.247-25')).toEqual({ ok: true, value: '52998224725' })
      expect(normalizePixKey('cpf', ' 52998224725 ')).toEqual({ ok: true, value: '52998224725' })
    })
    it('dígito verificador errado', () => {
      expect(normalizePixKey('cpf', '123.456.789-10')).toEqual({ ok: false, error: 'Esse CPF não é válido. Confere os números?' })
    })
    it('tamanho errado / letras', () => {
      expect(normalizePixKey('cpf', '123')).toEqual({ ok: false, error: 'CPF tem 11 dígitos' })
      expect(normalizePixKey('cpf', '529.982.247-2a')).toEqual({ ok: false, error: 'CPF só tem números' })
    })
  })

  describe('phone', () => {
    it('"(48) 99812-3344" → "+5548998123344"', () => {
      expect(normalizePixKey('phone', '(48) 99812-3344')).toEqual({ ok: true, value: '+5548998123344' })
    })
    it('aceita variações de formatação e o +55', () => {
      for (const raw of ['48998123344', '48 99812 3344', '+55 (48) 99812-3344', '5548998123344', '+5548998123344']) {
        expect(normalizePixKey('phone', raw)).toEqual({ ok: true, value: '+5548998123344' })
      }
    })
    it('fixo com 8 dígitos', () => {
      expect(normalizePixKey('phone', '(11) 3456-7890')).toEqual({ ok: true, value: '+551134567890' })
    })
    it('sem DDD, DDD inválido, celular sem 9', () => {
      expect(normalizePixKey('phone', '99812-3344')).toMatchObject({ ok: false, error: 'Coloca o DDD e o número, tipo (48) 99812-3344' })
      expect(normalizePixKey('phone', '(01) 99812-3344')).toMatchObject({ ok: false, error: 'Esse DDD não existe' })
      expect(normalizePixKey('phone', '(48) 89812-3344')).toMatchObject({ ok: false, error: 'Celular com 9 dígitos começa com 9' })
    })
  })

  describe('email', () => {
    it('trim + minúsculas', () => {
      expect(normalizePixKey('email', '  Lucas.Menezes@Gmail.COM ')).toEqual({ ok: true, value: 'lucas.menezes@gmail.com' })
    })
    it('inválido', () => {
      expect(normalizePixKey('email', 'lucas@gmail')).toMatchObject({ ok: false, error: 'Esse e-mail parece incompleto' })
      expect(normalizePixKey('email', `${'a'.repeat(70)}@gmail.com`)).toMatchObject({ ok: false })
    })
  })

  describe('random (EVP)', () => {
    it('UUID v4, normaliza para minúsculas', () => {
      expect(normalizePixKey('random', ' 123E4567-E89B-42D3-A456-426614174000 ')).toEqual({
        ok: true,
        value: '123e4567-e89b-42d3-a456-426614174000',
      })
    })
    it('rejeita UUID que não é v4 ou incompleto', () => {
      expect(normalizePixKey('random', '123e4567-e89b-12d3-a456-426614174000')).toMatchObject({ ok: false })
      expect(normalizePixKey('random', '123e4567e89b42d3a456426614174000')).toMatchObject({ ok: false })
    })
  })

  it('vazio', () => {
    expect(normalizePixKey('email', '   ')).toEqual({ ok: false, error: 'Preenche a chave Pix' })
  })
})

describe('formatPixKey', () => {
  it('formata para exibição', () => {
    expect(formatPixKey('cpf', '52998224725')).toBe('529.982.247-25')
    expect(formatPixKey('phone', '+5548998123344')).toBe('(48) 99812-3344')
    expect(formatPixKey('phone', '+551134567890')).toBe('(11) 3456-7890')
    expect(formatPixKey('email', 'a@b.co')).toBe('a@b.co')
  })
})
