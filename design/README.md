# Handoff: Racha Aí — web app mobile-first de divisão de despesas

## Overview
Racha Aí divide gastos entre amigos (viagens, república, rolês) e faz o acerto via Pix. Público: 18–30 anos, Brasil. Tom descontraído, mas confiável. Pacote cobre: login por magic link, lista de grupos, criação de grupo + convite, grupo (abas Gastos / Saldos / Acertos), novo gasto, modal Pagar com Pix, perfil, estados vazios, modo claro e escuro.

## About the Design Files
Os arquivos deste pacote são **referências de design feitas em HTML** — protótipos que mostram aparência e comportamento, **não código de produção**. A tarefa é **recriar esses designs no ambiente do codebase alvo** (React, Next.js, etc.) usando seus padrões e bibliotecas. Se ainda não existe codebase, recomendação: **Next.js (App Router) + React + TypeScript + Tailwind** (ou CSS Modules), com tokens como CSS custom properties.

Os `.dc.html` abrem direto no navegador (precisam do `support.js` ao lado). A lógica de cada tela está no `<script data-dc-script>` do arquivo — leia como pseudocódigo React (classe com `state`, `setState`, `renderVals()`).

## Fidelity
**High-fidelity.** Cores, tipografia, raios, espaçamentos e interações são finais. Recriar pixel-perfect.

## Design Tokens

### Cores (CSS vars, aplicadas no root do app)
| Token | Claro | Escuro | Uso |
|---|---|---|---|
| `--bg` | `#F3F5F4` | `#0A1110` | fundo da tela |
| `--surface` | `#FFFFFF` | `#141D1C` | cards, inputs, sheets |
| `--surface2` | `#EAEFEE` | `#1E2928` | tiles de emoji, trilho de tabs, trilho de barra |
| `--ink` | `#0F1A19` | `#ECF4F3` | texto principal |
| `--ink2` | `#5A6A68` | `#94A5A2` | texto secundário, labels |
| `--line` | `rgba(15,26,25,.1)` | `rgba(255,255,255,.09)` | bordas 1.5px, divisores 1px |
| `--brand` | `#32BCAD` | `#32BCAD` | verde Pix: botões primários, FAB, chip ativo |
| `--brandText` | `#0E8C80` | `#4FD6C6` | texto em verde da marca |
| `--onBrand` | `#04302B` | `#04302B` | texto sobre `--brand` |
| `--pos` | `#0E8C80` | `#4FD6C6` | **a receber** (texto) |
| `--posBg` | `#DDF4F1` | `rgba(50,188,173,.16)` | fundo de badge a receber |
| `--neg` | `#D9482A` | `#FF8B6E` | **a pagar** (texto) |
| `--negBg` | `#FFE9E2` | `rgba(255,107,74,.15)` | fundo de badge a pagar |
| `--shadow` | `0 1px 2px rgba(15,26,25,.04), 0 6px 20px rgba(15,26,25,.05)` | `0 1px 0 rgba(255,255,255,.03) inset` | cards |
| `--scrim` | `rgba(8,14,13,.45)` | `rgba(0,0,0,.6)` | fundo atrás do bottom sheet |

Barras de saldo: positivo `#32BCAD`, negativo `#FF6B4A` (iguais nos dois temas). Botão WhatsApp: fundo `#25D366`, texto `#06301A`. QR: módulos `#0B1211` sobre `#FFFFFF` (sempre, inclusive no escuro).

**Regra:** verde = a receber, coral = a pagar — sempre, em todo lugar (badges, saldo do grupo, valores dos acertos, barras, valor no modal Pix).

### Tipografia
Família: **Plus Jakarta Sans** (Google Fonts, 400/500/600/700/800). Valores monetários sempre com `font-variant-numeric: tabular-nums`.
| Uso | Tamanho / peso / tracking |
|---|---|
| Headline login | 42px / 800 / -0.04em, line-height 1.04 |
| Título de tela ("Seus grupos") | 28px / 800 / -0.035em |
| Nome do grupo (tela grupo) | 24px / 800 / -0.035em |
| Valor do teclado (aberto / recolhido) | 64px / 44px, 800, -0.05em |
| Valor modal Pix | 40px / 800 / -0.045em |
| Saldo do grupo | 34px / 800 / -0.04em |
| Totais (a receber/a pagar) | 22px / 800 / -0.03em |
| Título de card / item | 15–16px / 700 |
| Corpo | 15–16px / 400–600, line-height 1.5 |
| Label de campo | 13px / 700, cor `--ink2` |
| Legenda | 12px / 600 |

### Raios
Botão primário 18–20px · input 16–18px · card 22–26px · tile emoji 16–19px (grande 32–34px) · tabs trilho 18 / tab 14 · chip e badge 999px · bottom sheet 32px topo · FAB 22px.

### Espaçamento
Padding lateral de tela 20px (login 24px). Gap entre cards 10–12px. Gap entre seções de formulário 22–24px. Padding de card 14–18px. Alturas: botão primário 56–58px, secundário 46–54px, input 54–58px, botão ícone 44×44 circular, chip 40px, tecla 62px. Hit targets ≥ 44px.

## Componentes

### Avatar de membro (`Avatar.dc.html`)
Props: `who` (nome completo), `hue` (0–360), `size` (`sm` 28 · `md` 40 · `lg` 52 · `xl` 88), `selected`, `onClick`.
- Círculo, fundo `oklch(0.83 0.1 <hue>)`, texto `#132220`, iniciais (primeira letra do 1º e do último nome), 800, fonte = 36% do tamanho.
- Anel padrão `0 0 0 2px var(--surface)` (permite empilhar com `margin-right:-8px`).
- Selecionado: `0 0 0 2.5px var(--surface), 0 0 0 5px var(--brand)` + selo 18px verde com check no canto inferior direito.
- Hues usados: Você 172, Ana 30, Bia 340, Caio 265, Duda 95, Rafa 220, Gabi 0, Théo 140.

### Card de gasto (`ExpenseCard.dc.html`)
Props: `desc`, `payerName`, `payerShort`, `hue`, `amount` (centavos), `myShare` (centavos), `iPaid`, `date`, `onClick`.
- Linha: Avatar md · coluna (descrição 15/700, até 2 linhas · "{Quem} pagou · {data}" 13px ink2) · coluna direita (valor total 16/800 + linha de status 12/700).
- Status: não pagou e participa → coral "sua parte: R$ X"; você pagou → verde "+ R$ (total − sua parte)"; não participa → ink2 "você tá fora".
- Fundo surface, raio 22, padding 14×16, sombra; active `scale(.985)`.

### Badge de saldo (`BalanceBadge.dc.html`)
Props: `amount` (centavos, com sinal), `caption`.
- > 0: pílula `--posBg`/`--pos`, "+ R$ X"; < 0: `--negBg`/`--neg`, "− R$ X"; 0: `--surface2`/`--ink2` com check "Quite".
- Pílula padding 6×11, 14/800. Legenda opcional abaixo, 11/600: "a receber" / "a pagar".

### Chip de divisão (`SplitChip.dc.html`)
Props: `label`, `active`, `onClick`. Altura 40, pill, padding 0 16, 14px.
- Ativo: fundo e borda `--brand`, texto `--onBrand`, 700. Inativo: fundo surface, borda 1.5px `--line`, 600; hover borda `--brand`.
- Reutilizado para: modo de divisão, data, tipo de chave Pix.

### Bottom sheet
Overlay absoluto; scrim `--scrim` (fade 250ms). Painel surface, raio 32 32 0 0, padding 10 22 26, gap 16, max-height 92%, entra com `translateY(100%) → 0` em 320ms `cubic-bezier(.2,.9,.3,1)`. Alça 40×5 `--line` centralizada. Header: título 18/800 + botão fechar 36px circular surface2. Toque no scrim fecha.

## Screens / Views

### 1. Login
- Logo: dois círculos 40px sobrepostos (verde `#32BCAD` à esquerda, coral `#FF6B4A` 92% opacidade à direita, largura total 58) + "Racha Aí" 26/800.
- Headline "Racha a conta, **não a amizade.**" (segunda parte em `--brandText`). Sub: "Divida os gastos da viagem, da rep e do rolê. Na hora de acertar, é só um Pix."
- Rodapé: label "Seu e-mail", input, botão "Receber link de acesso" (desabilitado com opacity .4 até e-mail válido `/\S+@\S+\.\S+/`), nota "Sem senha. A gente te manda um link mágico."
- Estado enviado: card com ícone de envelope (tile 52 `--posBg`), "Confere seu e-mail", "Mandamos um link pra {email}. Toca nele e pronto, você entra.", botão primário (no protótipo "Abrir link (demo)"), link "Usar outro e-mail".

### 2. Meus grupos
- Header: "Oi, {primeiro nome}" 14/600 ink2 + "Seus grupos" 28/800; Avatar md do usuário à direita → Perfil.
- Grid 2 colunas: card "A receber" (ponto e valor verdes) e "A pagar" (coral) = soma dos saldos positivos / negativos do usuário em todos os grupos.
- Lista de cards de grupo: tile emoji 56 (raio 19, surface2, emoji 28px) · nome 16/700 · "{n} membros · {n} gastos" · BalanceBadge com legenda. Toque → Grupo.
- Botão fixo inferior "Novo grupo" (ícone +), com degradê de `--bg` por trás e sombra `0 10px 24px rgba(50,188,173,.3)`.

### 3a. Criar grupo
- Header: voltar + "Novo grupo". Pré-visualização: tile 104 (raio 34) com emoji 54px + nome ao vivo (placeholder "Seu novo grupo").
- Input "Nome do grupo" (máx 32, placeholder "Ex.: Viagem pra Ilhabela").
- "Escolhe um emoji": grid 6 colunas, 12 emojis (🏖️ 🏠 🍻 🎂 ✈️ 🔥 ⛺ 🎉 🍕 🚗 ⚽ 🛒), quadrados raio 16; selecionado = fundo `--posBg` + borda 2px `--brand`.
- Botão "Criar grupo" (desabilitado sem nome).

### 3b. Convite
- Fechar (X) no topo → Grupo. Tile 96 com emoji, "Agora chama a galera", "Quem entrar pelo link já participa dos gastos de **{grupo}**."
- Caixa do link (monospace, `racha.ai/c/{code}`) + botão "Copiar" (clipboard + toast "Link copiado").
- "Compartilhar no WhatsApp" → `https://wa.me/?text=` com "Bora rachar os gastos de "{grupo}" no Racha Aí? Entra aqui: {link}".
- "Já entraram · {n}" com avatares lg + nome; "Por enquanto, só você" quando n=1. Novos membros entram com animação (no protótipo simulado por timers).
- Botão secundário "Ir para o grupo".

### 4. Grupo
- Header: voltar · pilha de até 4 avatares sm · pílula "+ Convidar" → Convite.
- Identidade: tile 56 com emoji, nome 24/800, "{n} membros · total R$ X".
- Card de saldo: label ("Você tem a receber" / "Você deve no grupo" / "Você tá quite"), valor 34/800 colorido; se negativo, pílula "Acertar" (`--negBg`/`--neg`) → aba Acertos.
- Tabs segmentadas (trilho surface2, tab ativa surface + sombra leve, 42px). Aba Acertos mostra contador coral com nº de pagamentos que o usuário deve.
- **Gastos:** lista de ExpenseCards, ordem cronológica decrescente. FAB 64×64 verde (raio 22) no canto inferior direito → Novo gasto. Vazio: tile 🧾, "Nenhum gasto ainda", "Pagou alguma coisa pra galera? Registra aqui que o Racha Aí faz as contas.", botão "Adicionar primeiro gasto".
- **Saldos:** card com linhas: Avatar md · nome ("Você" pro usuário) · valor com sinal (verde/coral/ink2) · barra 8px com eixo central; positivo cresce do centro pra direita em `#32BCAD`, negativo pra esquerda em `#FF6B4A`; largura = |saldo| / maior |saldo| × 50%. Legenda "tem a receber" / "deve pro grupo" / "tá quite".
- **Acertos:** cards "Avatar → Avatar · {Fulano} → {Ciclano} · R$ X" (valor coral se o usuário paga, verde se recebe, ink se é entre terceiros). Ações:
  - Usuário paga: "Pagar com Pix" (primário, ícone losango) + "Já paguei".
  - Usuário recebe: "Lembrar no WhatsApp" + "Recebi" (`--posBg`).
  - Terceiros: "Marcar como pago".
  - Seção "Já pagos": linhas com valor · data + selo verde "✓ Pago".
  - Tudo quitado (com gastos): círculo 96 `--posBg` com check, "Tudo acertado 🎉", "Ninguém deve nada a ninguém neste grupo. Bora pro próximo rolê?"
  - Sem gastos: "Nada pra acertar ainda…"

### 5. Novo gasto
- Header: X + "Novo gasto" / "{emoji} {grupo}".
- **Modo teclado** (inicial): "Quanto foi?", "R$" 24/700 ink2 + valor 64/800 centralizado. Teclado 3×4 (1–9, 00, 0, ⌫), teclas 62px surface raio 20. Entrada em centavos da direita pra esquerda (digitar 1,2,7,5,0 → 127,50), máximo 8 dígitos. "Continuar" habilitado com valor > 0.
- **Modo formulário:** valor recolhido (44px; tocar reabre o teclado). Campos:
  - Descrição (máx 40, "Ex.: Mercado, Uber, Airbnb").
  - Quem pagou: scroll horizontal de Avatars lg com seleção única.
  - Como dividir: chips "Igual pra todos" / "Por valor" / "Só alguns" + card com linhas por membro:
    - Igual: parte de cada um.
    - Só alguns: toque na linha liga/desliga (check circular 24px; desligado com opacity .5); divide igual entre os marcados.
    - Por valor: input "R$ 0,00" por pessoa + status "Faltam R$ X pra fechar" / "Passou R$ X do total" (coral) / "Fechou certinho" (verde).
  - Data: chips "Hoje" / "Ontem" / "Outro dia" (mostra input date).
- Rodapé fixo: "Salvar gasto · R$ X". Quando inválido, botão cinza com o motivo: "Coloca o valor do gasto", "Falta a descrição", "Escolhe quem participa", "Os valores não fecham".
- Salvar → volta pra aba Gastos + toast "Gasto adicionado".

### 6. Modal Pagar com Pix (bottom sheet)
- Valor 40/800 coral, "para **{nome}**" com avatar sm.
- QR 216×216 em card branco raio 24 (padding 14). Abaixo "Chave: {chave}".
- "Copiar Pix copia e cola" (secundário, ícone copiar) → clipboard do payload EMV + toast "Código Pix copiado".
- "Marquei como pago" (primário) → registra pagamento, fecha sheet, toast "Pagamento registrado".
- Nota: "Abre o app do seu banco, escolhe Pix e escaneia o QR ou cola o código."
- **Produção:** gerar payload BR Code/EMV real (campos 00, 26 [GUI br.gov.bcb.pix + chave], 52, 53=986, 54 valor, 58=BR, 59 nome, 60 cidade, 62 txid, 63 CRC16-CCITT) e renderizar QR com lib (ex.: `qrcode`). O QR do protótipo é ilustrativo.

### 7. Perfil
- Avatar xl, nome 22/800, e-mail. Input "Nome".
- Card "Sua chave Pix": chips de tipo (CPF, Celular, E-mail, Aleatória) + input com placeholder por tipo (`000.000.000-00`, `(00) 00000-0000`, `voce@email.com`, `Cole sua chave aleatória`) + nota "É pra essa chave que a galera vai te pagar. Só aparece pra quem te deve."
- Linha "Modo escuro" com switch 52×32 (knob 26 branco, trilho `--brand` quando ligado).
- "Salvar" (toast "Perfil salvo") e "Sair da conta" (texto coral) → Login.

## Interactions & Behavior
- Transição de tela: fade + translateY(10px→0) 300–350ms ease.
- Toast: pílula `--ink` com texto `--bg`, 14/700, raio 16, `bottom:104px` centralizada, some após 2,2s.
- Active states: botões `scale(.98)`, FAB `scale(.94)`, cards `scale(.985)`. Focus de input: borda `--brand`.
- Scrollbars ocultas; áreas roláveis com padding inferior pra não ficar embaixo do FAB/botão fixo.

## State Management / Lógica
Valores sempre em **centavos (inteiros)**.
- `Group { id, name, emoji, members: MemberId[], expenses: Expense[], payments: Payment[], inviteCode }`
- `Expense { id, desc, amount, payer, shares: Record<MemberId, number>, date }`
- `Payment { from, to, amount, date }`
- **Divisão igual:** `base = floor(amount/n)`; os primeiros `amount − base·n` membros recebem +1 centavo.
- **Saldo por membro:** `+amount` pra quem pagou, `−share` pra cada participante; pagamentos: `from += amount`, `to −= amount`. Soma do grupo = 0.
- **Acertos sugeridos:** algoritmo guloso — ordenar credores e devedores por valor decrescente, casar o maior devedor com o maior credor, transferir `min`, repetir. Recalcular a cada gasto/pagamento.
- Meu saldo no grupo = `balance['me']`; totais da home = soma dos positivos / negativos em todos os grupos.
- Backend necessário: auth por magic link, CRUD de grupos/gastos/pagamentos, entrada via convite (`/c/{code}`), perfil com chave Pix. Sugestão: Supabase (auth magic link + Postgres + realtime pra membros entrando).

## Assets
Nenhuma imagem. Ícones são SVG de traço simples (24×24, stroke 2.2–2.6, pontas arredondadas): voltar, fechar, +, check, copiar, compartilhar, seta, envelope — pode trocar por Lucide (`chevron-left`, `x`, `plus`, `check`, `copy`, `share`, `arrow-right`, `mail`). Emojis nativos do sistema.

## Files
- `Racha Ai - Design.dc.html`: canvas com o protótipo (claro/escuro), todas as telas, modo escuro e a prancha de componentes. Abra este primeiro.
- `RachaAi.dc.html`: o app completo (todas as telas, estado e lógica de saldos/acertos/Pix). Props: `theme` (light/dark), `screen` (tela inicial).
- `Avatar.dc.html`, `ExpenseCard.dc.html`, `BalanceBadge.dc.html`, `SplitChip.dc.html`: componentes.
- `support.js`: runtime pra abrir os `.dc.html` no navegador (não faz parte do produto).
