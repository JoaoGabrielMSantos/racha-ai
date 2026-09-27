import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearPendingInvite, magicLinkRedirect, peekPendingInvite, savePendingInvite } from './invite'

// sessionStorage mínimo para o ambiente node
beforeEach(() => {
  const store = new Map<string, string>()
  vi.stubGlobal('sessionStorage', {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  })
})
afterEach(() => vi.unstubAllGlobals())

describe('convite pendente', () => {
  it('salva, lê e limpa', () => {
    expect(peekPendingInvite()).toBeNull()
    savePendingInvite('aB3dE5f')
    expect(peekPendingInvite()).toBe('aB3dE5f')
    clearPendingInvite()
    expect(peekPendingInvite()).toBeNull()
  })

  it('link mágico volta para /c/:code quando há convite (aba nova não tem o sessionStorage)', () => {
    savePendingInvite('aB3dE5f')
    expect(magicLinkRedirect('https://racha.app', '/perfil')).toBe('https://racha.app/c/aB3dE5f')
  })

  it('sem convite, volta para a página de origem (ou /)', () => {
    expect(magicLinkRedirect('https://racha.app', '/perfil')).toBe('https://racha.app/perfil')
    expect(magicLinkRedirect('https://racha.app', undefined)).toBe('https://racha.app/')
    expect(magicLinkRedirect('https://racha.app', 'https://evil.com')).toBe('https://racha.app/')
  })

  it('storage bloqueado não quebra', () => {
    vi.stubGlobal('sessionStorage', {
      getItem: () => {
        throw new Error('blocked')
      },
      setItem: () => {
        throw new Error('blocked')
      },
      removeItem: () => {
        throw new Error('blocked')
      },
    })
    expect(() => savePendingInvite('x')).not.toThrow()
    expect(peekPendingInvite()).toBeNull()
  })
})
