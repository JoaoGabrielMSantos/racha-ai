import { useState, type ReactNode } from 'react'
import { Copy, Plus, X, ChevronLeft } from 'lucide-react'
import { Avatar } from '@/components/Avatar'
import { BalanceBadge } from '@/components/BalanceBadge'
import { SplitChip } from '@/components/SplitChip'
import { ExpenseCard } from '@/components/ExpenseCard'
import { GroupCard } from '@/components/GroupCard'
import { TotalCard } from '@/components/TotalCard'
import { SegmentedTabs } from '@/components/SegmentedTabs'
import { Button } from '@/components/Button'
import { IconButton } from '@/components/IconButton'
import { Field, Input } from '@/components/Input'
import { SwitchRow } from '@/components/Switch'
import { LoadingList, Skeleton } from '@/components/Skeleton'
import { EmptyState } from '@/components/Screen'
import { BottomSheet } from '@/components/BottomSheet'
import { Logo, PixDiamond } from '@/components/Logo'
import { useToast } from '@/components/toast-context'
import { setTheme, useTheme, type Theme } from '@/lib/theme'

const PEOPLE = [
  { name: 'Lucas Menezes', hue: 172 },
  { name: 'Ana Clara', hue: 30 },
  { name: 'Beatriz Lima', hue: 340 },
  { name: 'Caio Ramos', hue: 265 },
  { name: 'Duda Souza', hue: 95 },
  { name: 'Rafael Torres', hue: 220 },
  { name: 'Gabriela Nunes', hue: 0 },
  { name: 'Théo Martins', hue: 140 },
]

/** /dev/componentes — prancha para comparar com design/*.dc.html, lado a lado claro/escuro. */
export default function DevComponents() {
  const theme = useTheme()
  return (
    <div className="min-h-full bg-bg px-4 py-6 text-ink">
      <div className="mx-auto flex max-w-[960px] flex-col gap-6">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="m-0 text-[28px] font-extrabold tracking-[-0.035em]">Componentes</h1>
            <p className="m-0 text-sm text-ink2">Prancha para comparar com design/*.dc.html</p>
          </div>
          <div className="w-60">
            <SwitchRow label="Tema do app: escuro" checked={theme === 'dark'} onChange={(on) => setTheme(on ? 'dark' : 'light')} />
          </div>
        </header>
        <div className="grid gap-6 md:grid-cols-2">
          <Board theme="light" />
          <Board theme="dark" />
        </div>
      </div>
    </div>
  )
}

function Board({ theme }: { theme: Theme }) {
  const toast = useToast()
  const [chip, setChip] = useState('equal')
  const [payer, setPayer] = useState(1)
  const [dark, setDark] = useState(theme === 'dark')
  const [tab, setTab] = useState<'gastos' | 'saldos' | 'acertos'>('gastos')
  const [sheet, setSheet] = useState(false)

  return (
    <section data-theme={theme} className="flex min-w-0 flex-col gap-7 rounded-[32px] bg-bg p-5 text-ink ring-1 ring-line">
      <div className="text-xs font-extrabold tracking-widest text-ink2 uppercase">{theme === 'light' ? 'Claro' : 'Escuro'}</div>

      <Block title="Logo">
        <Logo />
      </Block>

      <Block title="Avatar · sm / md / lg / xl / selecionado">
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name="Ana Clara" hue={30} size="sm" />
          <Avatar name="Ana Clara" hue={30} size="md" />
          <Avatar name="Ana Clara" hue={30} size="lg" />
          <Avatar name="Ana Clara" hue={30} size="xl" />
          <Avatar name="Ana Clara" hue={30} size="lg" selected />
        </div>
        <div className="flex">
          {PEOPLE.slice(0, 4).map((p) => (
            <div key={p.name} className="-mr-2">
              <Avatar name={p.name} hue={p.hue} size="sm" />
            </div>
          ))}
        </div>
        <div className="flex gap-4 overflow-x-auto px-1 pt-1.5 pb-1">
          {PEOPLE.map((p, i) => (
            <div key={p.name} className="flex flex-none flex-col items-center gap-2">
              <Avatar name={p.name} hue={p.hue} size="lg" selected={payer === i} onClick={() => setPayer(i)} />
              <div className={payer === i ? 'text-xs font-extrabold text-ink' : 'text-xs font-semibold text-ink2'}>
                {p.name.split(' ')[0]}
              </div>
            </div>
          ))}
        </div>
      </Block>

      <Block title="BalanceBadge">
        <div className="flex flex-wrap items-start gap-4">
          <BalanceBadge amount={4500} caption />
          <BalanceBadge amount={-12380} caption />
          <BalanceBadge amount={0} caption />
          <BalanceBadge amount={9999999} />
        </div>
      </Block>

      <Block title="SplitChip">
        <div className="flex flex-wrap gap-2">
          {[
            ['equal', 'Igual pra todos'],
            ['amount', 'Por valor'],
            ['some', 'Só alguns'],
          ].map(([k, l]) => (
            <SplitChip key={k} label={l!} active={chip === k} onClick={() => setChip(k!)} />
          ))}
        </div>
      </Block>

      <Block title="Totais (correção: R$ 99.999,99 cabe)">
        <div className="grid grid-cols-2 gap-2.5">
          <TotalCard kind="receive" cents={9999999} />
          <TotalCard kind="pay" cents={4572} />
        </div>
        <div className="grid w-[300px] grid-cols-2 gap-2.5">
          <TotalCard kind="receive" cents={9999999} />
          <TotalCard kind="pay" cents={9999999} />
        </div>
      </Block>

      <Block title="GroupCard (correção: nome em até 2 linhas)">
        <GroupCard name="Viagem Floripa" emoji="🏖️" memberCount={4} expenseCount={6} balance={-6720} />
        <GroupCard
          name="República Casa Verde da Rua Treze de Maio"
          emoji="🏠"
          memberCount={5}
          expenseCount={12}
          balance={1234567}
        />
        <GroupCard name="Aniversário da Bia" emoji="🎂" memberCount={5} expenseCount={2} balance={0} />
        <GroupCard name="Rolê" emoji="🍻" memberCount={1} expenseCount={1} balance={450} />
      </Block>

      <Block title="ExpenseCard (correção: sem data na linha)">
        <DayHeader>Hoje</DayHeader>
        <ExpenseCard description="Airbnb na Lagoa" payerName="Ana Clara" payerShort="Ana" hue={30} amount={184000} myShare={46000} iPaid={false} />
        <ExpenseCard description="Jantar na Costa da Lagoa" payerName="Lucas Menezes" payerShort="Você" hue={172} amount={48600} myShare={12150} iPaid />
        <DayHeader>16 set</DayHeader>
        <ExpenseCard description="Passeio de barco" payerName="Beatriz Lima" payerShort="Bia" hue={340} amount={36000} myShare={0} iPaid={false} />
        <ExpenseCard
          description="Compra enorme de mercado com churrasco, bebidas e gelo pro fim de semana"
          payerName="Caio Ramos"
          payerShort="Caio"
          hue={265}
          amount={9999999}
          myShare={2499999}
          iPaid={false}
        />
      </Block>

      <Block title="SegmentedTabs">
        <SegmentedTabs
          label="Seções do grupo"
          value={tab}
          onChange={setTab}
          tabs={[
            { key: 'gastos', label: 'Gastos' },
            { key: 'saldos', label: 'Saldos' },
            { key: 'acertos', label: 'Acertos', count: 2 },
          ]}
        />
      </Block>

      <Block title="Button">
        <Button icon={<Plus size={20} strokeWidth={2.6} />}>Novo grupo</Button>
        <Button disabled>Receber link de acesso</Button>
        <Button loading>Salvando</Button>
        <Button variant="secondary" size="lg" className="h-[54px] text-[15px]">
          Ir para o grupo
        </Button>
        <Button variant="whatsapp">Compartilhar no WhatsApp</Button>
        <Button variant="blocked" className="text-[15px]">
          Falta a descrição
        </Button>
        <div className="flex gap-2">
          <Button size="md" full={false} icon={<PixDiamond />} className="flex-1 gap-2.5">
            Pagar com Pix
          </Button>
          <Button size="md" variant="secondary" full={false} className="px-3.5 text-sm">
            Já paguei
          </Button>
        </div>
        <div className="flex gap-2">
          <Button size="md" variant="secondary" full={false} className="flex-1 text-sm">
            Lembrar no WhatsApp
          </Button>
          <Button size="md" variant="posSoft" full={false} className="text-sm">
            Recebi
          </Button>
        </div>
        <Button size="sm" variant="secondary">
          Marcar como pago
        </Button>
        <Button variant="danger" className="h-12 text-[15px]">
          Sair da conta
        </Button>
        <div className="flex items-center gap-3">
          <IconButton label="Voltar">
            <ChevronLeft size={20} strokeWidth={2.4} />
          </IconButton>
          <IconButton label="Fechar">
            <X size={18} strokeWidth={2.4} />
          </IconButton>
          <Button variant="secondary" size="sm" full={false} className="h-11 rounded-[14px] border-0 bg-surface2 px-3.5" icon={<Copy size={16} strokeWidth={2.2} />}>
            Copiar
          </Button>
        </div>
      </Block>

      <Block title="Input">
        <Field label="Seu e-mail">{({ id }) => <Input id={id} type="email" placeholder="voce@email.com" />}</Field>
        <Field label="Nome do grupo" error="Dá um nome pro grupo">
          {({ id, describedBy }) => <Input id={id} invalid aria-describedby={describedBy} defaultValue="" placeholder="Ex.: Viagem pra Ilhabela" />}
        </Field>
        <Input tone="inset" placeholder="000.000.000-00" />
      </Block>

      <Block title="Switch">
        <SwitchRow label="Modo escuro" checked={dark} onChange={setDark} />
      </Block>

      <Block title="Skeleton / loading">
        <div className="grid grid-cols-2 gap-2.5">
          <Skeleton className="h-[78px] rounded-3xl" />
          <Skeleton className="h-[78px] rounded-3xl" />
        </div>
        <LoadingList count={2} tile="emoji" />
      </Block>

      <Block title="Estados">
        <EmptyState
          icon="🧾"
          title="Nenhum gasto ainda"
          text="Pagou alguma coisa pra galera? Registra aqui que o Racha Aí faz as contas."
          action={
            <Button size="md" full={false} className="h-[52px] rounded-[18px] px-[22px]">
              Adicionar primeiro gasto
            </Button>
          }
        />
      </Block>

      <Block title="Toast / BottomSheet">
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" full={false} className="flex-1" onClick={() => toast('Link copiado')}>
            Mostrar toast
          </Button>
          <Button variant="secondary" size="sm" full={false} className="flex-1" onClick={() => setSheet(true)}>
            Abrir sheet
          </Button>
        </div>
        <BottomSheet open={sheet} title="Pagar com Pix" onClose={() => setSheet(false)}>
          <div data-theme={theme} className="flex flex-col gap-4 bg-surface">
            <div className="tabular text-center text-[40px] font-extrabold tracking-[-0.045em] text-neg">R$ 67,20</div>
            <p className="m-0 text-center text-xs text-ink2">Conteúdo do sheet de exemplo.</p>
            <Button onClick={() => setSheet(false)}>Marquei como pago</Button>
          </div>
        </BottomSheet>
      </Block>
    </section>
  )
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="text-[13px] font-bold text-ink2">{title}</div>
      {children}
    </div>
  )
}

function DayHeader({ children }: { children: ReactNode }) {
  return <div className="px-1 pt-1 text-[13px] font-bold text-ink2">{children}</div>
}
