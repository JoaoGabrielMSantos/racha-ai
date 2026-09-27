import { Logo } from './Logo'
import { Button } from './Button'
import { EmptyState } from './Screen'

/** Tela de espera enquanto a sessão/perfil carregam. */
export function Splash() {
  return (
    <div className="flex flex-1 items-center justify-center" aria-busy="true" aria-label="Carregando">
      <div className="animate-ra-shimmer">
        <Logo />
      </div>
    </div>
  )
}

/** Erro de carregamento de tela inteira, com "Tentar de novo". */
export function ScreenError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-1 items-center justify-center px-5">
      <EmptyState
        icon="😵"
        title="Não deu pra carregar"
        text={message}
        action={
          onRetry && (
            <Button size="md" full={false} className="h-[52px] rounded-[18px] px-[22px]" onClick={onRetry}>
              Tentar de novo
            </Button>
          )
        }
      />
    </div>
  )
}
