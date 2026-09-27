import { extendTailwindMerge } from 'tailwind-merge'

// Ensina ao tailwind-merge os utilitários próprios do tema (cores e sombras dos tokens).
const twMerge = extendTailwindMerge({
  extend: {
    theme: {
      color: ['bg', 'surface', 'surface2', 'ink', 'ink2', 'line', 'brand', 'brand-text', 'on-brand', 'pos', 'pos-bg', 'neg', 'neg-bg', 'scrim', 'bar-pos', 'bar-neg', 'whatsapp', 'on-whatsapp'],
      shadow: ['card', 'brand', 'fab', 'tab', 'toast'],
    },
  },
})

/** Junta classes; em conflito (ex.: border-[1.5px] vs border-0), a última vence. */
export function cn(...parts: Array<string | false | null | undefined>): string {
  return twMerge(parts.filter(Boolean).join(' '))
}
