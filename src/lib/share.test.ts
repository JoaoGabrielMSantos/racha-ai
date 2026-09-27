import { describe, expect, it } from 'vitest'
import { whatsAppUrl } from './share'

describe('whatsAppUrl', () => {
  it('codifica o texto no wa.me', () => {
    expect(whatsAppUrl('Bora rachar os gastos de "Rolê & cia"? https://x.app/c/aB3')).toBe(
      'https://wa.me/?text=Bora%20rachar%20os%20gastos%20de%20%22Rol%C3%AA%20%26%20cia%22%3F%20https%3A%2F%2Fx.app%2Fc%2FaB3',
    )
  })
})
