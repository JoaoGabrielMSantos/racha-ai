import { z } from 'zod'
import { formatPixKey, normalizePixKey, type PixKeyType } from '@/lib/pix-key'
import type { MyProfile, ProfileUpdate } from '@/api/profile'

export const PIX_TYPES = ['cpf', 'phone', 'email', 'random'] as const satisfies readonly PixKeyType[]

/** Formulário de nome + chave Pix (onboarding e perfil). A chave é opcional. */
export const profileSchema = z
  .object({
    displayName: z.string().trim().min(1, 'Coloca seu nome').max(40, 'Nome muito longo (máx. 40)'),
    pixType: z.enum(PIX_TYPES),
    pixKey: z.string(),
  })
  .superRefine((v, ctx) => {
    if (!v.pixKey.trim()) return
    const r = normalizePixKey(v.pixType, v.pixKey)
    if (!r.ok) ctx.addIssue({ code: 'custom', path: ['pixKey'], message: r.error })
  })

export type ProfileFormValues = z.infer<typeof profileSchema>

export function profileDefaults(p: MyProfile | undefined): ProfileFormValues {
  const type = p?.pixKeyType ?? 'email'
  return {
    displayName: p?.displayName ?? '',
    pixType: type,
    pixKey: p?.pixKey ? formatPixKey(type, p.pixKey) : '',
  }
}

export function toProfileUpdate(v: ProfileFormValues): ProfileUpdate {
  const raw = v.pixKey.trim()
  const r = raw ? normalizePixKey(v.pixType, raw) : null
  return {
    displayName: v.displayName.trim(),
    pixKeyType: r?.ok ? v.pixType : null,
    pixKey: r?.ok ? r.value : null,
  }
}
