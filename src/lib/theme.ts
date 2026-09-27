import { useSyncExternalStore } from 'react'

export type Theme = 'light' | 'dark'
const KEY = 'racha-theme'
const media = () => window.matchMedia('(prefers-color-scheme: dark)')

function stored(): Theme | null {
  try {
    const t = localStorage.getItem(KEY)
    return t === 'light' || t === 'dark' ? t : null
  } catch {
    return null
  }
}

export function resolveTheme(): Theme {
  return stored() ?? (media().matches ? 'dark' : 'light')
}

const listeners = new Set<() => void>()

function apply() {
  const t = resolveTheme()
  document.documentElement.setAttribute('data-theme', t)
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t === 'dark' ? '#0A1110' : '#F3F5F4')
  listeners.forEach((l) => l())
}

/** Padrão = prefers-color-scheme; o switch do Perfil sobrescreve e salva. */
export function setTheme(theme: Theme) {
  try {
    localStorage.setItem(KEY, theme)
  } catch {
    // modo privado: vale só nesta sessão
  }
  apply()
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  const m = media()
  const onChange = () => {
    if (!stored()) apply()
  }
  m.addEventListener('change', onChange)
  return () => {
    listeners.delete(cb)
    m.removeEventListener('change', onChange)
  }
}

export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, resolveTheme, () => 'light')
}
