import { useState } from 'react'
import { useNavigate } from 'react-router'
import { ChevronLeft } from 'lucide-react'
import { friendlyError } from '@/api/errors'
import { GROUP_EMOJIS, useCreateGroup } from '@/api/groups'
import { Button } from '@/components/Button'
import { IconButton } from '@/components/IconButton'
import { Field, FieldError, Input, Label } from '@/components/Input'
import { FooterBar, Screen, ScreenHeader, ScreenTitle, ScrollArea } from '@/components/Screen'
import { cn } from '@/lib/cn'

export default function CreateGroupScreen() {
  const navigate = useNavigate()
  const create = useCreateGroup()
  const [name, setName] = useState('')
  const [emoji, setEmoji] = useState<string>(GROUP_EMOJIS[0])
  const ok = name.trim().length > 0

  const submit = async () => {
    if (!ok || create.isPending) return
    const id = await create.mutateAsync({ name, emoji })
    navigate(`/g/${id}/convite`, { replace: true })
  }

  return (
    <Screen>
      <ScreenHeader>
        <IconButton label="Voltar" onClick={() => navigate('/')}>
          <ChevronLeft size={20} strokeWidth={2.4} />
        </IconButton>
        <ScreenTitle title="Novo grupo" />
      </ScreenHeader>
      <form
        noValidate
        className="flex min-h-0 flex-1 flex-col"
        onSubmit={(e) => {
          e.preventDefault()
          void submit()
        }}
      >
        <ScrollArea className="flex flex-col gap-6 pt-5">
          <div className="flex flex-none flex-col items-center gap-3.5 py-2" aria-hidden="true">
            <div className="flex size-[104px] items-center justify-center rounded-[34px] bg-surface text-[54px] shadow-card">
              {emoji}
            </div>
            <div className="min-h-[26px] max-w-full text-center text-xl font-extrabold tracking-[-0.02em] break-words text-ink">
              {name.trim() || 'Seu novo grupo'}
            </div>
          </div>

          <Field label="Nome do grupo">
            {({ id }) => (
              <Input
                id={id}
                autoFocus
                value={name}
                maxLength={32}
                placeholder="Ex.: Viagem pra Ilhabela"
                onChange={(e) => setName(e.target.value)}
              />
            )}
          </Field>

          <div className="flex flex-col gap-2.5">
            <Label>Escolhe um emoji</Label>
            <div className="grid grid-cols-6 gap-2" role="radiogroup" aria-label="Emoji do grupo">
              {GROUP_EMOJIS.map((e) => {
                const active = e === emoji
                return (
                  <button
                    key={e}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    aria-label={e}
                    onClick={() => setEmoji(e)}
                    className={cn(
                      'flex aspect-square items-center justify-center rounded-2xl border-2 text-2xl transition-all duration-150 active:scale-95',
                      active ? 'border-brand bg-pos-bg shadow-none' : 'border-transparent bg-surface shadow-card',
                    )}
                  >
                    {e}
                  </button>
                )
              })}
            </div>
          </div>
        </ScrollArea>
        <FooterBar bordered={false}>
          <FieldError>{create.isError ? friendlyError(create.error) : null}</FieldError>
          <Button type="submit" disabled={!ok} loading={create.isPending} className={create.isError ? 'mt-2' : ''}>
            Criar grupo
          </Button>
        </FooterBar>
      </form>
    </Screen>
  )
}
