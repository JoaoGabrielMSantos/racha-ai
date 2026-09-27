import { useEffect, useRef, useState } from 'react'
import { Navigate, useLocation } from 'react-router'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Mail } from 'lucide-react'
import { supabase } from '@/api/supabase'
import { friendlyError } from '@/api/errors'
import { useAuth } from '@/auth/auth-context'
import { Screen } from '@/components/Screen'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/Button'
import { FieldError, Input, Label } from '@/components/Input'
import { CodeInput } from '@/components/CodeInput'
import { magicLinkRedirect } from '@/lib/invite'

const emailSchema = z.object({
  email: z.string().trim().regex(/\S+@\S+\.\S+/, 'Esse e-mail parece incompleto'),
})
type EmailForm = z.infer<typeof emailSchema>

const RESEND_SECONDS = 60
const CODE_LENGTH = 6

type FromState = { from?: { pathname: string; search?: string } } | null

export default function LoginScreen() {
  const { session } = useAuth()
  const location = useLocation()
  const from = (location.state as FromState)?.from
  const fromPath = from ? from.pathname + (from.search ?? '') : undefined
  const [sentTo, setSentTo] = useState<string | null>(null)

  if (session) return <Navigate to={fromPath ?? '/'} replace />

  return (
    <Screen>
      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-6 pt-3 pb-[calc(28px+env(safe-area-inset-bottom))]">
        <div className="flex flex-1 flex-col justify-center gap-[26px] py-6">
          <Logo />
          <h1 className="m-0 text-[42px] leading-[1.04] font-extrabold tracking-[-0.04em] text-balance text-ink">
            Racha a conta, <span className="text-brand-text">não a amizade.</span>
          </h1>
          <p className="m-0 text-base leading-normal text-pretty text-ink2">
            Divida os gastos da viagem, da rep e do rolê. Na hora de acertar, é só um Pix.
          </p>
        </div>
        {sentTo ? (
          <SentCard email={sentTo} fromPath={fromPath} onReset={() => setSentTo(null)} />
        ) : (
          <EmailStep fromPath={fromPath} onSent={setSentTo} />
        )}
      </div>
    </Screen>
  )
}

async function sendLink(email: string, fromPath: string | undefined) {
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: magicLinkRedirect(window.location.origin, fromPath) },
  })
  if (error) throw error
}

function EmailStep({ fromPath, onSent }: { fromPath?: string; onSent: (email: string) => void }) {
  const [serverError, setServerError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { isValid, isSubmitting },
  } = useForm<EmailForm>({ resolver: zodResolver(emailSchema), mode: 'onChange', defaultValues: { email: '' } })

  const onSubmit = handleSubmit(async ({ email }) => {
    setServerError(null)
    try {
      await sendLink(email, fromPath)
      onSent(email)
    } catch (err) {
      setServerError(friendlyError(err))
    }
  })

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-3">
      <Label htmlFor="login-email">Seu e-mail</Label>
      <Input
        id="login-email"
        type="email"
        inputMode="email"
        autoComplete="email"
        autoCapitalize="off"
        spellCheck={false}
        placeholder="voce@email.com"
        aria-describedby={serverError ? 'login-err' : undefined}
        {...register('email', { onChange: () => setServerError(null) })}
      />
      <FieldError id="login-err">{serverError}</FieldError>
      <Button type="submit" disabled={!isValid} loading={isSubmitting} className="rounded-[18px]">
        Receber link de acesso
      </Button>
      <p className="m-0 mt-1 text-center text-[13px] text-ink2">Sem senha. A gente te manda um link mágico.</p>
    </form>
  )
}

function SentCard({ email, fromPath, onReset }: { email: string; fromPath?: string; onReset: () => void }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(false)
  const [cooldown, setCooldown] = useState(RESEND_SECONDS)
  const [resending, setResending] = useState(false)
  const codeRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (cooldown <= 0) return
    const t = window.setTimeout(() => setCooldown((s) => s - 1), 1000)
    return () => window.clearTimeout(t)
  }, [cooldown])

  const verify = async (token: string) => {
    if (verifying || token.length !== CODE_LENGTH) return
    setVerifying(true)
    setError(null)
    const { error: err } = await supabase.auth.verifyOtp({ email, token, type: 'email' })
    // sucesso: o AuthProvider recebe SIGNED_IN e a tela redireciona sozinha
    if (err) {
      setError(friendlyError(err))
      setCode('')
      setVerifying(false)
      codeRef.current?.focus()
    }
  }

  const resend = async () => {
    setResending(true)
    setError(null)
    try {
      await sendLink(email, fromPath)
      setCooldown(RESEND_SECONDS)
    } catch (err) {
      setError(friendlyError(err))
    } finally {
      setResending(false)
    }
  }

  return (
    <div className="flex animate-ra-in flex-col gap-3.5 rounded-[28px] bg-surface p-6 shadow-card">
      <div className="flex size-[52px] items-center justify-center rounded-[18px] bg-pos-bg text-pos" aria-hidden="true">
        <Mail size={26} strokeWidth={2.2} />
      </div>
      <h2 className="m-0 text-[21px] font-extrabold tracking-[-0.02em] text-ink">Confere seu e-mail</h2>
      <p className="m-0 text-[15px] leading-normal text-ink2">
        Mandamos um link pra <b className="break-all text-ink">{email}</b>. Toca nele e pronto, você entra.
      </p>

      <form
        className="mt-1 flex flex-col gap-2.5"
        onSubmit={(e) => {
          e.preventDefault()
          void verify(code)
        }}
      >
        <Label htmlFor="login-code">Ou digita o código de {CODE_LENGTH} dígitos do e-mail</Label>
        <CodeInput
          ref={codeRef}
          id="login-code"
          value={code}
          length={CODE_LENGTH}
          onChange={(v) => {
            setCode(v)
            setError(null)
          }}
          onComplete={(v) => void verify(v)}
          invalid={!!error}
          disabled={verifying}
          describedBy={error ? 'login-code-err' : undefined}
        />
        <FieldError id="login-code-err">{error}</FieldError>
        <Button type="submit" disabled={code.length !== CODE_LENGTH} loading={verifying} className="h-14 rounded-[18px]">
          Entrar
        </Button>
      </form>

      <div className="flex flex-col items-center">
        {cooldown > 0 ? (
          <p className="m-0 flex h-11 items-center text-[13px] font-semibold text-ink2" aria-live="polite">
            Não chegou? Dá pra reenviar em {cooldown}s
          </p>
        ) : (
          <Button variant="ghost" loading={resending} className="h-11 text-sm text-brand-text" onClick={resend}>
            Reenviar e-mail
          </Button>
        )}
        <Button variant="ghost" className="h-11 text-sm" onClick={onReset}>
          Usar outro e-mail
        </Button>
      </div>
    </div>
  )
}
