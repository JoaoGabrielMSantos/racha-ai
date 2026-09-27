import { useCallback, useMemo } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { useNavigate, useParams } from 'react-router'
import { Check, X } from 'lucide-react'
import { friendlyError } from '@/api/errors'
import { canEditExpense, useGroupExpenses, useSaveExpense } from '@/api/expenses'
import { useGroup, useGroupMembers, type Member } from '@/api/groups'
import { useSession } from '@/auth/auth-context'
import { Avatar } from '@/components/Avatar'
import { Button } from '@/components/Button'
import { IconButton } from '@/components/IconButton'
import { FieldError, Input, Label } from '@/components/Input'
import { Keypad } from '@/components/Keypad'
import { EmptyState, FooterBar, Screen, ScreenHeader, ScreenTitle, ScrollArea } from '@/components/Screen'
import { Splash } from '@/components/Splash'
import { SplitChip } from '@/components/SplitChip'
import { useToast } from '@/components/toast-context'
import { cn } from '@/lib/cn'
import {
  blankDraft,
  draftAmount,
  draftFromExpense,
  draftInvalidReason,
  draftRemainder,
  draftShares,
  remainderText,
  toSavePayload,
  type DateChoice,
  type ExpenseDraft,
  type SplitMode,
} from '@/lib/expense-draft'
import { applyKeypadKey, formatAmount, formatBRL, type KeypadKey } from '@/lib/money'
import { fullName, shortName } from '@/lib/names'
import { toISODate } from '@/lib/dates'

const MODES: [SplitMode, string][] = [
  ['equal', 'Igual pra todos'],
  ['amount', 'Por valor'],
  ['some', 'Só alguns'],
]
const DATES: [DateChoice, string][] = [
  ['today', 'Hoje'],
  ['yesterday', 'Ontem'],
  ['other', 'Outro dia'],
]

/** /g/:id/novo-gasto e /g/:id/gasto/:expenseId/editar */
export default function ExpenseFormScreen() {
  const { id: groupId = '', expenseId } = useParams()
  const navigate = useNavigate()
  const session = useSession()
  const group = useGroup(groupId)
  const members = useGroupMembers(groupId)
  const expenses = useGroupExpenses(groupId)
  const close = () => navigate(`/g/${groupId}`, { replace: true })

  const loading = group.isPending || members.isPending || (!!expenseId && expenses.isPending)
  const error = group.error ?? members.error ?? (expenseId ? expenses.error : null)
  const existing = expenseId ? expenses.data?.find((e) => e.id === expenseId) : undefined

  const header = (
    <ScreenHeader>
      <IconButton label="Fechar" onClick={close}>
        <X size={18} strokeWidth={2.4} />
      </IconButton>
      <ScreenTitle
        title={expenseId ? 'Editar gasto' : 'Novo gasto'}
        subtitle={group.data ? `${group.data.emoji} ${group.data.name}` : undefined}
      />
    </ScreenHeader>
  )

  if (loading) return <Splash />

  const problem =
    error || !group.data
      ? { title: 'Não deu pra abrir', text: error ? friendlyError(error) : 'Esse grupo não existe mais ou você não participa dele.' }
      : expenseId && !existing
        ? { title: 'Gasto não encontrado', text: 'Ele pode ter sido excluído por alguém do grupo.' }
        : existing && !canEditExpense(existing, session.user.id)
          ? { title: 'Sem permissão', text: 'Só quem lançou ou quem pagou pode editar esse gasto.' }
          : null

  if (problem) {
    return (
      <Screen>
        {header}
        <ScrollArea>
          <EmptyState
            icon="🧾"
            title={problem.title}
            text={problem.text}
            action={
              <Button size="md" full={false} className="h-[52px] rounded-[18px] px-[22px]" onClick={close}>
                Voltar pro grupo
              </Button>
            }
          />
        </ScrollArea>
      </Screen>
    )
  }

  const memberList = members.data ?? []
  const memberIds = memberList.map((m) => m.id)
  const initial = existing ? draftFromExpense(existing, memberIds) : blankDraft(memberIds, session.user.id)

  return (
    <Screen>
      {header}
      <ExpenseForm
        groupId={groupId}
        expenseId={expenseId}
        members={memberList}
        initial={initial}
        startWithKeypad={!existing}
        onDone={close}
      />
    </Screen>
  )
}

type FormProps = {
  groupId: string
  expenseId?: string
  members: Member[]
  initial: ExpenseDraft
  startWithKeypad: boolean
  onDone: () => void
}

type FormValues = ExpenseDraft & { keypad: boolean }

export function ExpenseForm({ groupId, expenseId, members, initial, startWithKeypad, onDone }: FormProps) {
  const session = useSession()
  const toast = useToast()
  const save = useSaveExpense(groupId)
  const meId = session.user.id
  const memberIds = useMemo(() => members.map((m) => m.id), [members])

  const { control, setValue, getValues, register } = useForm<FormValues>({
    defaultValues: { ...initial, keypad: startWithKeypad },
  })
  const v = useWatch({ control }) as FormValues
  const amount = draftAmount(v)
  const shares = draftShares(v, memberIds)
  const reason = draftInvalidReason(v, memberIds)

  const set = <K extends keyof FormValues>(k: K, value: FormValues[K]) =>
    setValue(k, value as never, { shouldDirty: true })

  const onKey = useCallback(
    (k: KeypadKey) => setValue('digits', applyKeypadKey(getValues('digits'), k), { shouldDirty: true }),
    [getValues, setValue],
  )
  const closeKeypad = useCallback(() => {
    if (draftAmount(getValues()) > 0) setValue('keypad', false)
  }, [getValues, setValue])

  const submit = async () => {
    const draft = getValues()
    if (draftInvalidReason(draft, memberIds)) return
    await save.mutateAsync(toSavePayload(draft, memberIds, groupId, expenseId))
    toast(expenseId ? 'Gasto atualizado' : 'Gasto adicionado')
    onDone()
  }

  const big = v.keypad
  const amountBox = (
    <div
      role={big ? undefined : 'button'}
      tabIndex={big ? undefined : 0}
      aria-label={big ? undefined : `Valor: ${formatBRL(amount)}. Toca pra mudar`}
      onClick={() => !big && set('keypad', true)}
      onKeyDown={(e) => {
        if (!big && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          set('keypad', true)
        }
      }}
      className={cn(
        'flex flex-col items-center justify-center gap-1.5 px-5',
        big ? 'min-h-0 flex-1' : 'flex-none cursor-pointer pt-2 pb-3.5',
      )}
    >
      <div className="text-[13px] font-bold text-ink2">Quanto foi?</div>
      <div className="flex items-baseline gap-2 text-ink" aria-live="polite">
        <span className="text-2xl font-bold text-ink2">R$</span>
        <span
          className={cn(
            'tabular leading-[1.05] font-extrabold tracking-[-0.05em] transition-[font-size] duration-200',
            big ? 'text-[64px]' : 'text-[44px]',
            amount ? 'text-ink' : 'text-ink2',
          )}
        >
          {formatAmount(amount)}
        </span>
      </div>
    </div>
  )

  if (big) {
    return (
      <>
        {amountBox}
        <div className="flex flex-none flex-col gap-3 px-5 pt-2 pb-[calc(26px+env(safe-area-inset-bottom))]">
          <Keypad onKey={onKey} onEnter={closeKeypad} />
          <Button disabled={amount <= 0} onClick={closeKeypad}>
            Continuar
          </Button>
        </div>
      </>
    )
  }

  const remainder = draftRemainder(v, memberIds)
  const sel = new Set(v.selected)

  return (
    <>
      {amountBox}
      <form
        noValidate
        className="flex min-h-0 flex-1 flex-col"
        onSubmit={(e) => {
          e.preventDefault()
          void submit()
        }}
      >
        <ScrollArea className="flex animate-ra-in flex-col gap-[22px] pt-1.5 pb-5">
          <div className="flex flex-col gap-2.5">
            <Label htmlFor="exp-desc">Descrição</Label>
            <Input
              id="exp-desc"
              maxLength={40}
              placeholder="Ex.: Mercado, Uber, Airbnb"
              className="h-14"
              autoComplete="off"
              {...register('description')}
            />
          </div>

          <div className="flex flex-col gap-3">
            <Label>Quem pagou</Label>
            <div className="-mx-5 flex gap-4 overflow-x-auto px-6 pt-1.5 pb-1" role="radiogroup" aria-label="Quem pagou">
              {members.map((m) => {
                const on = v.paidBy === m.id
                return (
                  <div key={m.id} className="flex flex-none flex-col items-center gap-2">
                    <Avatar name={fullName(m)} hue={m.avatarHue} size="lg" selected={on} onClick={() => set('paidBy', m.id)} />
                    <div className={on ? 'text-xs font-extrabold text-ink' : 'text-xs font-semibold text-ink2'}>
                      {shortName(m, meId)}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <Label>Como dividir</Label>
            <div className="flex flex-wrap gap-2">
              {MODES.map(([k, l]) => (
                <SplitChip key={k} label={l} active={v.mode === k} onClick={() => set('mode', k)} />
              ))}
            </div>
            <div className="rounded-[22px] bg-surface px-3.5 py-1 shadow-card">
              {members.map((m, i) => {
                const on = v.mode !== 'some' || sel.has(m.id)
                const share = shares.find((s) => s.userId === m.id)?.amountCents ?? 0
                const rowCls = cn(
                  'flex min-h-14 w-full items-center gap-3 py-2 text-left transition-opacity duration-150',
                  i > 0 && 'border-t border-line',
                  !on && 'opacity-50',
                )
                const inner = (
                  <>
                    <Avatar name={fullName(m)} hue={m.avatarHue} size="sm" />
                    <div className="min-w-0 flex-1 truncate text-[15px] font-semibold text-ink">
                      {m.id === meId ? 'Você' : fullName(m)}
                    </div>
                    {v.mode === 'amount' ? (
                      <label className="flex h-10 items-center gap-1.5 rounded-xl bg-surface2 px-3">
                        <span className="text-[13px] font-bold text-ink2">R$</span>
                        <input
                          value={v.custom[m.id] ?? ''}
                          onChange={(e) =>
                            set('custom', { ...getValues('custom'), [m.id]: e.target.value.replace(/[^\d.,]/g, '') })
                          }
                          inputMode="decimal"
                          placeholder="0,00"
                          aria-label={`Parte de ${m.id === meId ? 'você' : fullName(m)}`}
                          className="tabular w-[72px] border-0 bg-transparent text-right text-[15px] font-bold text-ink outline-none"
                        />
                      </label>
                    ) : (
                      <div className="tabular text-[15px] font-bold text-ink">{formatBRL(share)}</div>
                    )}
                    {v.mode === 'some' && (
                      <span
                        aria-hidden="true"
                        className={cn(
                          'flex size-6 flex-none items-center justify-center rounded-full text-on-brand',
                          on ? 'bg-brand' : 'border-2 border-line',
                        )}
                      >
                        {on && <Check size={12} strokeWidth={3.5} />}
                      </span>
                    )}
                  </>
                )
                return v.mode === 'some' ? (
                  <button
                    key={m.id}
                    type="button"
                    role="checkbox"
                    aria-checked={on}
                    className={rowCls}
                    onClick={() => {
                      const cur = new Set(getValues('selected'))
                      if (cur.has(m.id)) cur.delete(m.id)
                      else cur.add(m.id)
                      set('selected', memberIds.filter((id) => cur.has(id)))
                    }}
                  >
                    {inner}
                  </button>
                ) : (
                  <div key={m.id} className={rowCls}>
                    {inner}
                  </div>
                )
              })}
            </div>
            {v.mode === 'amount' && (
              <div className={cn('px-1 text-[13px] font-bold', remainder === 0 ? 'text-pos' : 'text-neg')} aria-live="polite">
                {remainderText(remainder)}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <Label htmlFor="exp-date">Data</Label>
            <div className="flex flex-wrap items-center gap-2">
              {DATES.map(([k, l]) => (
                <SplitChip key={k} label={l} active={v.dateChoice === k} onClick={() => set('dateChoice', k)} />
              ))}
            </div>
            {v.dateChoice === 'other' && (
              <input
                id="exp-date"
                type="date"
                value={v.otherDate}
                max={toISODate(new Date())}
                onChange={(e) => set('otherDate', e.target.value)}
                className="h-[52px] w-full rounded-2xl border-[1.5px] border-line bg-surface px-4 text-[15px] font-semibold text-ink outline-none focus:border-brand"
              />
            )}
          </div>
        </ScrollArea>

        <FooterBar>
          <FieldError>{save.isError ? friendlyError(save.error) : null}</FieldError>
          {reason ? (
            <Button variant="blocked" className={cn('text-[15px]', save.isError && 'mt-2')} aria-disabled="true" type="button">
              {reason}
            </Button>
          ) : (
            <Button type="submit" loading={save.isPending} className={save.isError ? 'mt-2' : ''}>
              {expenseId ? 'Salvar alterações' : 'Salvar gasto'} · {formatBRL(amount)}
            </Button>
          )}
        </FooterBar>
      </form>
    </>
  )
}
