import type { CSSProperties } from 'react'
import { cn } from '@/lib/cn'

export function Skeleton({ className, style }: { className?: string; style?: CSSProperties }) {
  return <div aria-hidden="true" className={cn('animate-ra-shimmer rounded-lg bg-surface2', className)} style={style} />
}

/** Esqueleto no formato do card de grupo / ExpenseCard. */
export function CardSkeleton({ tile = 'avatar' }: { tile?: 'avatar' | 'emoji' }) {
  return (
    <div className="flex items-center gap-3.5 rounded-[22px] bg-surface px-4 py-3.5 shadow-card">
      {tile === 'emoji' ? (
        <Skeleton className="size-14 flex-none rounded-[19px]" />
      ) : (
        <Skeleton className="size-10 flex-none rounded-full" />
      )}
      <div className="flex flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-3/5" />
        <Skeleton className="h-3 w-2/5" />
      </div>
      <Skeleton className="h-7 w-20 flex-none rounded-full" />
    </div>
  )
}

export function LoadingList({ count = 4, tile }: { count?: number; tile?: 'avatar' | 'emoji' }) {
  return (
    <div className="flex flex-col gap-2.5" aria-busy="true" aria-label="Carregando">
      {Array.from({ length: count }, (_, i) => (
        <CardSkeleton key={i} tile={tile} />
      ))}
    </div>
  )
}
