import { describe, expect, it } from 'vitest'
import { firstName, fullName, shortName } from './names'

describe('names', () => {
  const ana = { id: 'a', displayName: 'Ana Clara', avatarHue: 30 }
  it('firstName', () => {
    expect(firstName('  Ana Clara ')).toBe('Ana')
    expect(firstName(null)).toBe('')
  })
  it('shortName: "Você" para mim, primeiro nome para os outros', () => {
    expect(shortName(ana, 'a')).toBe('Você')
    expect(shortName(ana, 'b')).toBe('Ana')
  })
  it('perfil invisível (saiu do grupo) vira "Ex-membro"', () => {
    expect(fullName(undefined)).toBe('Ex-membro')
    expect(shortName({ id: 'x', displayName: null, avatarHue: 0 }, 'a')).toBe('Ex-membro')
  })
})
