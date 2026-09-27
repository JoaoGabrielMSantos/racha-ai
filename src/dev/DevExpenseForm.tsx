import type { Session } from '@supabase/supabase-js'
import { AuthContext } from '@/auth/auth-context'
import type { Member } from '@/api/groups'
import { ScreenHeader, ScreenTitle, Screen } from '@/components/Screen'
import { ExpenseForm } from '@/features/expenses/ExpenseFormScreen'
import { blankDraft } from '@/lib/expense-draft'

const ME = '00000000-0000-4000-8000-000000000001'
const MEMBERS: Member[] = [
  { id: ME, displayName: 'Lucas Menezes', avatarHue: 172, joinedAt: '' },
  { id: '00000000-0000-4000-8000-000000000002', displayName: 'Ana Clara', avatarHue: 30, joinedAt: '' },
  { id: '00000000-0000-4000-8000-000000000003', displayName: 'Beatriz Lima', avatarHue: 340, joinedAt: '' },
  { id: '00000000-0000-4000-8000-000000000004', displayName: 'Caio Ramos', avatarHue: 265, joinedAt: '' },
]

/**
 * /dev/novo-gasto — prévia do formulário real com membros fictícios, sem login.
 * Não salva nada: a sessão é falsa e o Supabase recusaria a chamada.
 */
export default function DevExpenseForm() {
  const fake = { user: { id: ME, email: 'lucas@exemplo.com' } } as unknown as Session
  return (
    <AuthContext.Provider value={{ ready: true, session: fake }}>
      <div className="relative mx-auto flex h-dvh max-w-[480px] flex-col overflow-hidden bg-bg">
        <Screen>
          <ScreenHeader>
            <ScreenTitle title="Novo gasto" subtitle="🏖️ Viagem Floripa" />
          </ScreenHeader>
          <ExpenseForm
            groupId="dev"
            members={MEMBERS}
            initial={blankDraft(MEMBERS.map((m) => m.id), ME)}
            startWithKeypad
            onDone={() => {}}
          />
        </Screen>
      </div>
    </AuthContext.Provider>
  )
}
