/** PRNG determinístico (mulberry32) para testes de propriedade reproduzíveis. */
export function rng(seed: number) {
  let a = seed >>> 0
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const int = (min: number, max: number) => min + Math.floor(next() * (max - min + 1))
  const pick = <T>(xs: readonly T[]): T => xs[int(0, xs.length - 1)]!
  const subset = <T>(xs: readonly T[]): T[] => {
    const s = xs.filter(() => next() < 0.6)
    return s.length ? s : [pick(xs)]
  }
  return { next, int, pick, subset }
}
