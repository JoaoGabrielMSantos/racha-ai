import { useNavigate } from 'react-router'
import { useMyProfile } from '@/api/profile'
import { Avatar } from '@/components/Avatar'
import { EmptyState, Screen, ScrollArea } from '@/components/Screen'

/** Provisório (etapa 4): a Home de verdade entra na etapa 5. */
export default function HomeScreen() {
  const navigate = useNavigate()
  const { data: me } = useMyProfile()
  const name = me?.displayName ?? ''
  return (
    <Screen>
      <div className="flex flex-none items-center justify-between px-5 pt-3 pb-2.5">
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="truncate text-sm font-semibold text-ink2">Oi, {name.split(' ')[0]}</div>
          <h1 className="m-0 text-[28px] font-extrabold tracking-[-0.035em] text-ink">Seus grupos</h1>
        </div>
        <Avatar name={name} hue={me?.avatarHue ?? 172} size="md" onClick={() => navigate('/perfil')} />
      </div>
      <ScrollArea>
        <EmptyState icon="🚧" title="Em construção" text="A lista de grupos chega na próxima etapa." />
      </ScrollArea>
    </Screen>
  )
}
