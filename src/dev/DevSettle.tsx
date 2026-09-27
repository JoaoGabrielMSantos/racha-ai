import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import type { Session } from '@supabase/supabase-js'
import { AuthContext } from '@/auth/auth-context'
import type { Member } from '@/api/groups'
import { settlementKeys, type CreditorPix, type Settlement } from '@/api/settlements'
import { Screen, ScreenHeader, ScreenTitle, ScrollArea } from '@/components/Screen'
import { SegmentedTabs } from '@/components/SegmentedTabs'
import { BalanceCard } from '@/features/balances/BalanceCard'
import { BalancesTab } from '@/features/balances/BalancesTab'
import { SettleTab } from '@/features/settle/SettleTab'
import { groupMoney } from '@/lib/group-money'
import { splitEqually } from '@/lib/split'

const id = (n: number) => `00000000-0000-4000-8000-00000000000${n}`
const ME = id(1)
const ANA = id(2)
const BIA = id(3)
const CAIO = id(4)
const GROUP = 'dev-floripa'

const MEMBERS: Member[] = [
  { id: ME, displayName: 'Lucas Menezes', avatarHue: 172, joinedAt: '' },
  { id: ANA, displayName: 'Ana Clara', avatarHue: 30, joinedAt: '' },
  { id: BIA, displayName: 'Beatriz Lima', avatarHue: 340, joinedAt: '' },
  { id: CAIO, displayName: 'Caio Ramos', avatarHue: 265, joinedAt: '' },
]
const all = [ME, ANA, BIA, CAIO]
const exp = (eid: string, paidBy: string, amount: number, who = all) => ({
  id: eid,
  paidBy,
  amountCents: amount,
  splits: splitEqually(amount, who),
})
// Mesmos gastos do protótipo (Viagem Floripa)
const EXPENSES = [
  exp('e1', ANA, 184000),
  exp('e2', CAIO, 26000),
  exp('e3', ME, 31240),
  exp('e4', ME, 48600),
  exp('e5', BIA, 36000, [ME, ANA, BIA]),
  exp('e6', ANA, 8400),
]
const SETTLEMENTS: Settlement[] = [
  { id: 's1', fromUser: CAIO, toUser: BIA, amountCents: 1500, createdBy: CAIO, paidAt: new Date().toISOString() },
]

/** /dev/acertos — prévia de Saldos, Acertos e do modal Pix com dados do protótipo (sem salvar). */
export default function DevSettle() {
  const qc = useQueryClient()
  const [tab, setTab] = useState<'saldos' | 'acertos'>('acertos')
  const [seeded] = useState(() => {
    const ok: CreditorPix = { status: 'ok', displayName: 'Ana Clara', type: 'phone', key: '+5548998123344' }
    const missing: CreditorPix = { status: 'missing', displayName: 'Caio Ramos' }
    qc.setQueryData(settlementKeys.pixKey(GROUP, ANA), ok)
    qc.setQueryData(settlementKeys.pixKey(GROUP, CAIO), missing)
    return true
  })
  const fake = { user: { id: ME, email: 'lucas@exemplo.com' } } as unknown as Session
  const money = groupMoney(EXPENSES, SETTLEMENTS, all)
  const map = new Map(MEMBERS.map((m) => [m.id, m]))

  return (
    <AuthContext.Provider value={{ ready: seeded, session: fake }}>
      <div className="relative mx-auto flex h-dvh max-w-[480px] flex-col overflow-hidden bg-bg">
        <Screen>
          <ScreenHeader>
            <ScreenTitle title="Acertos (prévia)" subtitle="🏖️ Viagem Floripa" />
          </ScreenHeader>
          <ScrollArea className="flex flex-col gap-4 pt-2.5">
            <BalanceCard value={money.balances[ME] ?? 0} onSettle={() => setTab('acertos')} />
            <SegmentedTabs
              label="Seções"
              value={tab}
              onChange={setTab}
              tabs={[
                { key: 'saldos', label: 'Saldos' },
                { key: 'acertos', label: 'Acertos', count: money.pending.filter((p) => p.from === ME).length },
              ]}
            />
            {tab === 'saldos' ? (
              <BalancesTab balances={money.balances} members={MEMBERS} memberMap={map} meId={ME} loading={false} />
            ) : (
              <SettleTab
                groupId={GROUP}
                groupName="Viagem Floripa"
                pending={money.pending}
                settlements={SETTLEMENTS}
                hasExpenses
                memberMap={map}
                meId={ME}
                loading={false}
              />
            )}
          </ScrollArea>
        </Screen>
      </div>
    </AuthContext.Provider>
  )
}
