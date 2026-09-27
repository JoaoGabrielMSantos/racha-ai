import { z } from 'zod'
import { addDays, toISODate } from './dates'
import { formatAmount, formatBRL, parseCentsInput, parseMoneyText } from './money'
import { splitEqually, type Share } from './split'

export type SplitMode = 'equal' | 'amount' | 'some'
export type DateChoice = 'today' | 'yesterday' | 'other'

/** Estado do formulário "Novo gasto" (também usado para editar). */
export type ExpenseDraft = {
  /** Dígitos do teclado de centavos ("12750" = R$ 127,50). */
  digits: string
  description: string
  paidBy: string
  mode: SplitMode
  /** Modo "Só alguns": quem participa. */
  selected: string[]
  /** Modo "Por valor": texto digitado por pessoa ("12,50"). */
  custom: Record<string, string>
  dateChoice: DateChoice
  /** YYYY-MM-DD, usado quando dateChoice = 'other'. */
  otherDate: string
}

export function blankDraft(memberIds: readonly string[], meId: string, today = toISODate(new Date())): ExpenseDraft {
  return {
    digits: '',
    description: '',
    paidBy: meId,
    mode: 'equal',
    selected: [...memberIds],
    custom: {},
    dateChoice: 'today',
    otherDate: today,
  }
}

export type ExistingExpense = {
  amountCents: number
  description: string
  paidBy: string
  splitMode: SplitMode
  expenseDate: string
  splits: readonly { userId: string; amountCents: number }[]
}

/** Preenche o formulário a partir de um gasto salvo (Editar). */
export function draftFromExpense(e: ExistingExpense, memberIds: readonly string[], today = toISODate(new Date())): ExpenseDraft {
  const inSplit = new Set(e.splits.filter((s) => s.amountCents > 0).map((s) => s.userId))
  const custom: Record<string, string> = {}
  for (const s of e.splits) if (s.amountCents > 0) custom[s.userId] = formatAmount(s.amountCents)
  const dateChoice: DateChoice =
    e.expenseDate === today ? 'today' : e.expenseDate === addDays(today, -1) ? 'yesterday' : 'other'
  return {
    digits: String(e.amountCents),
    description: e.description,
    paidBy: e.paidBy,
    mode: e.splitMode,
    selected: memberIds.filter((id) => inSplit.has(id)),
    custom,
    dateChoice,
    otherDate: e.expenseDate,
  }
}

export function draftAmount(d: ExpenseDraft): number {
  return parseCentsInput(d.digits)
}

export function draftDate(d: ExpenseDraft, today = toISODate(new Date())): string {
  if (d.dateChoice === 'today') return today
  if (d.dateChoice === 'yesterday') return addDays(today, -1)
  return d.otherDate
}

/** Partes por pessoa, na ordem dos membros. Inclui zeros (a tela mostra todo mundo). */
export function draftShares(d: ExpenseDraft, memberIds: readonly string[]): Share[] {
  const amount = draftAmount(d)
  if (d.mode === 'equal') return splitEqually(amount, memberIds)
  if (d.mode === 'some') {
    const sel = new Set(d.selected)
    const eq = new Map(splitEqually(amount, memberIds.filter((id) => sel.has(id))).map((s) => [s.userId, s.amountCents]))
    return memberIds.map((userId) => ({ userId, amountCents: eq.get(userId) ?? 0 }))
  }
  return memberIds.map((userId) => ({ userId, amountCents: parseMoneyText(d.custom[userId] ?? '') }))
}

/** Modo "Por valor": quanto falta (>0) ou passou (<0) do total. */
export function draftRemainder(d: ExpenseDraft, memberIds: readonly string[]): number {
  return draftAmount(d) - draftShares(d, memberIds).reduce((a, s) => a + s.amountCents, 0)
}

export function remainderText(diff: number): string {
  if (diff > 0) return `Faltam ${formatBRL(diff)} pra fechar`
  if (diff < 0) return `Passou ${formatBRL(-diff)} do total`
  return 'Fechou certinho'
}

/**
 * Validação do rascunho. As mensagens viram o texto do botão cinza, na ordem do design:
 * "Coloca o valor do gasto" → "Falta a descrição" → "Escolhe quem participa" → "Os valores não fecham".
 */
export function draftSchema(memberIds: readonly string[]) {
  return z
    .custom<ExpenseDraft>()
    .superRefine((d, ctx) => {
      const issue = (message: string) => ctx.addIssue({ code: 'custom', message })
      if (draftAmount(d) <= 0) return issue('Coloca o valor do gasto')
      if (!d.description.trim()) return issue('Falta a descrição')
      if (d.description.trim().length > 40) return issue('Descrição muito longa')
      if (!memberIds.includes(d.paidBy)) return issue('Escolhe quem pagou')
      if (d.mode === 'some' && !d.selected.some((id) => memberIds.includes(id))) return issue('Escolhe quem participa')
      if (d.mode === 'amount' && draftRemainder(d, memberIds) !== 0) return issue('Os valores não fecham')
      if (d.dateChoice === 'other' && !/^\d{4}-\d{2}-\d{2}$/.test(d.otherDate)) return issue('Escolhe a data')
    })
}

/** null = válido; senão, o motivo (texto do botão). */
export function draftInvalidReason(d: ExpenseDraft, memberIds: readonly string[]): string | null {
  const r = draftSchema(memberIds).safeParse(d)
  return r.success ? null : (r.error.issues[0]?.message ?? 'Confere os dados')
}

export type SaveExpensePayload = {
  id?: string
  group_id: string
  description: string
  amount_cents: number
  paid_by: string
  split_mode: SplitMode
  expense_date: string
  splits: { user_id: string; amount_cents: number }[]
}

/** Payload da RPC save_expense. Partes zeradas ficam de fora ("você tá fora"). */
export function toSavePayload(
  d: ExpenseDraft,
  memberIds: readonly string[],
  groupId: string,
  expenseId?: string,
  today = toISODate(new Date()),
): SaveExpensePayload {
  return {
    ...(expenseId ? { id: expenseId } : {}),
    group_id: groupId,
    description: d.description.trim(),
    amount_cents: draftAmount(d),
    paid_by: d.paidBy,
    split_mode: d.mode,
    expense_date: draftDate(d, today),
    splits: draftShares(d, memberIds)
      .filter((s) => s.amountCents > 0)
      .map((s) => ({ user_id: s.userId, amount_cents: s.amountCents })),
  }
}
