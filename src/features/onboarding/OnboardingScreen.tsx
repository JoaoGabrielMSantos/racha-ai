import { Controller, useForm, useWatch } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Navigate, useLocation, useNavigate } from 'react-router'
import { supabase } from '@/api/supabase'
import { friendlyError } from '@/api/errors'
import { useMyProfile, useUpdateProfile } from '@/api/profile'
import { useSession } from '@/auth/auth-context'
import { Avatar } from '@/components/Avatar'
import { Button } from '@/components/Button'
import { Field, FieldError, Input } from '@/components/Input'
import { FooterBar, Screen, ScreenHeader, ScrollArea } from '@/components/Screen'
import { ScreenError, Splash } from '@/components/Splash'
import { PixKeyCard } from '@/features/profile/PixKeyCard'
import { profileDefaults, profileSchema, toProfileUpdate, type ProfileFormValues } from '@/features/profile/profile-form'

type FromState = { from?: { pathname: string; search?: string } } | null

/** Primeiro login (display_name vazio): nome obrigatório + chave Pix opcional. */
export default function OnboardingScreen() {
  const profile = useMyProfile()
  const location = useLocation()
  const from = (location.state as FromState)?.from
  const next = from ? from.pathname + (from.search ?? '') : '/'

  if (profile.isPending) return <Splash />
  if (profile.isError) return <ScreenError message={friendlyError(profile.error)} onRetry={() => profile.refetch()} />
  if (profile.data.displayName) return <Navigate to={next} replace />
  return <OnboardingForm next={next} hue={profile.data.avatarHue} />
}

function OnboardingForm({ next, hue }: { next: string; hue: number }) {
  const session = useSession()
  const navigate = useNavigate()
  const update = useUpdateProfile()
  const email = session.user.email ?? ''

  const {
    control,
    register,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    mode: 'onChange',
    defaultValues: profileDefaults(undefined),
  })
  const name = useWatch({ control, name: 'displayName' })

  const onSubmit = handleSubmit(async (values) => {
    await update.mutateAsync(toProfileUpdate(values))
    navigate(next, { replace: true })
  })

  return (
    <Screen>
      <ScreenHeader className="justify-end">
        <Button variant="ghost" full={false} className="h-11 px-2 text-sm" onClick={() => supabase.auth.signOut()}>
          Sair
        </Button>
      </ScreenHeader>
      <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-1 flex-col">
        <ScrollArea className="flex flex-col gap-[22px] pt-1">
          <div className="flex flex-col items-center gap-3.5 pb-1 text-center">
            <Avatar name={name.trim() || '?'} hue={hue} size="xl" />
            <div className="flex flex-col gap-2">
              <h1 className="m-0 text-[28px] leading-[1.1] font-extrabold tracking-[-0.035em] text-balance text-ink">
                Como a galera te chama?
              </h1>
              <p className="m-0 text-[15px] leading-normal text-pretty text-ink2">
                É assim que seu nome aparece nos grupos e nos acertos.
              </p>
            </div>
          </div>

          <Field label="Seu nome" error={errors.displayName?.message}>
            {({ id, describedBy }) => (
              <Input
                id={id}
                autoFocus
                autoComplete="name"
                maxLength={40}
                placeholder="Ex.: Lucas Menezes"
                invalid={!!errors.displayName}
                aria-describedby={describedBy}
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
                    optional
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
          <p className="-mt-2 px-1 text-[13px] text-ink2">Dá pra cadastrar ou trocar a chave depois, no Perfil.</p>
        </ScrollArea>
        <FooterBar>
          <FieldError>{update.isError ? friendlyError(update.error) : null}</FieldError>
          <Button type="submit" disabled={!isValid} loading={update.isPending} className={update.isError ? 'mt-2' : ''}>
            Continuar
          </Button>
        </FooterBar>
      </form>
    </Screen>
  )
}
