import { Outlet, useLocation } from 'react-router'

/**
 * Coluna mobile-first (máx. 480px) centralizada. Cada tela cuida do próprio scroll;
 * a key por pathname reinicia a animação de entrada (raIn) a cada navegação.
 */
export function AppShell() {
  const { pathname } = useLocation()
  return (
    <div className="relative mx-auto flex h-dvh max-w-[480px] flex-col overflow-hidden bg-bg pt-[env(safe-area-inset-top)]">
      <div key={pathname} className="flex min-h-0 flex-1 flex-col">
        <Outlet />
      </div>
    </div>
  )
}
