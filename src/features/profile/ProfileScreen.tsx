import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router'
import { ChevronLeft } from 'lucide-react'
import { supabase } from '@/api/supabase'
import { friendlyError } from '@/api/errors'
import { useMyProfile, useUpdateProfile, type MyProfile } from '@/api/profile'
import { useSession } from '@/auth/auth-context'
import { Avatar } from '@/components/Avatar'
import { Button } from '@/components/Button'
import { Field, FieldError, Input } from '@/components/Input'
import { IconButton } from '@/components/IconButton'
import { Screen, ScreenHeader, ScreenTitle, ScrollArea } from '@/components/Screen'
import { ScreenError } from '@/components/Splash'
import { Skeleton } from '@/components/Skeleton'
import { SwitchRow } from '@/components/Switch'
import { useToast } from '@/components/toast-context'
import { setTheme, useTheme } from '@/lib/theme'
import { PixKeyCard } from './PixKeyCard'
import { profileDefaults, profileSchema, toProfileUpdate, type ProfileFormValues } from './profile-form'

export default function ProfileScreen() {
  const navigate = useNavigate()
  const profile = useMyProfile()

  return (
    <Screen>
      <ScreenHeader>
        <IconButton label="Voltar" onClick={() => navigate('/')}>
          <ChevronLeft size={20} strokeWidth={2.4} />
        </IconButton>
        <ScreenTitle title="Perfil" />
      </ScreenHeader>
      {profile.isPending ? (
        <ProfileSkeleton />
      ) : profile.isError ? (
        <ScreenError message={friendlyError(profile.error)} onRetry={() => profile.refetch()} />
      ) : (
        // key: remonta o form com os valores salvos quando o perfil muda
        <ProfileForm key={profile.dataUpdatedAt} profile={profile.data} />
      )}
    </Screen>
  )
}

function ProfileForm({ profile }: { profile: MyProfile }) {
  const session = useSession()
  const toast = useToast()
  const theme = useTheme()
  const update = useUpdateProfile()
  const email = session.user.email ?? ''

  const {
    control,
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    mode: 'onTouched',
    defaultValues: profileDefaults(profile),
  })
  const name = useWatch({ control, name: 'displayName' })

  const onSubmit = handleSubmit(async (values) => {
    await update.mutateAsync(toProfileUpdate(values))
    toast('Perfil salvo')
  })

  return (
    <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
      {/* Correção 4: a tela rola e os botões não encolhem */}
      <ScrollArea className="flex flex-col gap-[22px] pt-3">
        <div className="flex flex-none flex-col items-center gap-2.5 py-1.5">
          <Avatar name={name.trim() || profile.displayName || '?'} hue={profile.avatarHue} size="xl" />
          <div className="max-w-full truncate text-[22px] font-extrabold tracking-[-0.03em] text-ink">
            {name.trim() || profile.displayName}
          </div>
          <div className="max-w-full truncate text-[13px] text-ink2">{email}</div>
        </div>

        <Field label="Nome" error={errors.displayName?.message}>
          {({ id, describedBy }) => (
            <Input
              id={id}
              autoComplete="name"
              maxLength={40}
              invalid={!!errors.displayName}
              aria-describedby={describedBy}
              className="h-14"
              {...register('displayName')}
            />
          )}
        </Field>

        <Controller
          control={control}
          name="pixType"
          render={({ field: typeField }) => (
            <Controller
              control={control}
              name="pixKey"
              render={({ field, fieldState }) => (
                <PixKeyCard
                  type={typeField.value}
                  value={field.value}
                  error={fieldState.error?.message}
                  accountEmail={email}
                  onTypeChange={typeField.onChange}
                  onValueChange={field.onChange}
                  onBlur={field.onBlur}
                />
              )}
            />
          )}
        />

        <SwitchRow label="Modo escuro" checked={theme === 'dark'} onChange={(on) => setTheme(on ? 'dark' : 'light')} />

        <div className="flex flex-none flex-col gap-2">
          <FieldError>{update.isError ? friendlyError(update.error) : null}</FieldError>
          <Button type="submit" loading={update.isPending} className="h-14">
            Salvar
          </Button>
          <Button variant="danger" className="h-12 text-[15px]" onClick={() => supabase.auth.signOut()}>
            Sair da conta
          </Button>
        </div>
      </ScrollArea>
    </form>
  )
}

function ProfileSkeleton() {
  return (
    <div className="flex flex-col gap-[22px] px-5 pt-3" aria-busy="true" aria-label="Carregando perfil">
      <div className="flex flex-col items-center gap-2.5 py-1.5">
        <Skeleton className="size-[88px] rounded-full" />
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-3.5 w-48" />
      </div>
      <Skeleton className="h-14 rounded-[18px]" />
      <Skeleton className="h-[210px] rounded-[26px]" />
      <Skeleton className="h-16 rounded-[22px]" />
    </div>
  )
}
