import { describe, expect, it } from 'vitest'
import { profileDefaults, profileSchema, toProfileUpdate } from './profile-form'

describe('profileSchema', () => {
  it('nome obrigatório (espaços não contam)', () => {
    const r = profileSchema.safeParse({ displayName: '   ', pixType: 'email', pixKey: '' })
    expect(r.success).toBe(false)
    expect(r.error?.issues[0]?.message).toBe('Coloca seu nome')
  })
  it('chave Pix é opcional', () => {
    expect(profileSchema.safeParse({ displayName: 'Ana', pixType: 'cpf', pixKey: '' }).success).toBe(true)
  })
  it('chave preenchida é validada pelo tipo, com erro em pt-BR no campo pixKey', () => {
    const r = profileSchema.safeParse({ displayName: 'Ana', pixType: 'cpf', pixKey: '123.456.789-10' })
    expect(r.success).toBe(false)
    expect(r.error?.issues[0]).toMatchObject({ path: ['pixKey'], message: 'Esse CPF não é válido. Confere os números?' })
  })
})

describe('toProfileUpdate', () => {
  it('normaliza a chave e apara o nome', () => {
    expect(toProfileUpdate({ displayName: '  Ana Clara ', pixType: 'phone', pixKey: '(48) 99812-3344' })).toEqual({
      displayName: 'Ana Clara',
      pixKeyType: 'phone',
      pixKey: '+5548998123344',
    })
  })
  it('chave vazia remove a chave (tipo também vira null)', () => {
    expect(toProfileUpdate({ displayName: 'Ana', pixType: 'email', pixKey: '  ' })).toEqual({
      displayName: 'Ana',
      pixKeyType: null,
      pixKey: null,
    })
  })
})

describe('profileDefaults', () => {
  it('sem perfil: e-mail como tipo padrão e campos vazios', () => {
    expect(profileDefaults(undefined)).toEqual({ displayName: '', pixType: 'email', pixKey: '' })
  })
  it('chave salva aparece formatada', () => {
    expect(
      profileDefaults({ id: 'x', displayName: 'Ana', avatarHue: 30, pixKeyType: 'phone', pixKey: '+5548998123344' }),
    ).toEqual({ displayName: 'Ana', pixType: 'phone', pixKey: '(48) 99812-3344' })
  })
})
