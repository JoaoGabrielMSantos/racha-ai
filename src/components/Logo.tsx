/** Dois círculos sobrepostos (verde Pix + coral) + "Racha Aí". */
export function Logo() {
  return (
    <div className="flex items-center gap-3">
      <div className="relative h-10 w-[58px] flex-none" aria-hidden="true">
        <div className="absolute top-0 left-0 size-10 rounded-full bg-[#32BCAD]" />
        <div className="absolute top-0 right-0 size-10 rounded-full bg-[#FF6B4A] opacity-[.92]" />
      </div>
      <div className="text-[26px] font-extrabold tracking-[-0.035em] text-ink">Racha Aí</div>
    </div>
  )
}

/** Losango do Pix (usado em "Pagar com Pix" e no card de chave). */
export function PixDiamond({ size = 11, stroke = 2.2, className }: { size?: number; stroke?: number; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={'inline-block flex-none rotate-45 rounded-[3px] border-current ' + (className ?? '')}
      style={{ width: size, height: size, borderWidth: stroke }}
    />
  )
}
