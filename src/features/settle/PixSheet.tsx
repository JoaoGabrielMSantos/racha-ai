import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Copy } from 'lucide-react'
import { friendlyError } from '@/api/errors'
import type { Member } from '@/api/groups'
import { useCreateSettlement, useCreditorPix } from '@/api/settlements'
import { Avatar } from '@/components/Avatar'
import { BottomSheet } from '@/components/BottomSheet'
import { Button } from '@/components/Button'
import { FieldError } from '@/components/Input'
import { Skeleton } from '@/components/Skeleton'
import { useToast } from '@/components/toast-context'
import { askPixKeyMessage, pixTxid } from '@/lib/group-money'
import { formatBRL } from '@/lib/money'
import { firstName, fullName } from '@/lib/names'
import { formatPixKey } from '@/lib/pix-key'
import { buildPixPayload } from '@/lib/pix-payload'
import { copyText, openWhatsApp } from '@/lib/share'
import type { Transfer } from '@/lib/settle'

type Props = {
  transfer: Transfer | null
  groupId: string
  groupName: string
  members: Map<string, Member>
  meId: string
  onClose: () => void
}

/** Modal "Pagar com Pix": QR (sempre preto no branco) + copia e cola + "Marquei como pago". */
export function PixSheet({ transfer, onClose, ...rest }: Props) {
  // Guarda o último acerto para a animação de saída
  const [shown, setShown] = useState<Transfer | null>(transfer)
  if (transfer && transfer !== shown) setShown(transfer)
  return (
    <BottomSheet open={!!transfer} title="Pagar com Pix" onClose={onClose}>
      {shown && <PixBody key={`${shown.to}:${shown.amountCents}`} transfer={shown} onClose={onClose} {...rest} />}
    </BottomSheet>
  )
}

function PixBody({ transfer: t, groupId, groupName, members, meId, onClose }: Omit<Props, 'transfer'> & { transfer: Transfer }) {
  const toast = useToast()
  const pix = useCreditorPix(groupId, t.to)
  const create = useCreateSettlement(groupId)
  const creditor = members.get(t.to)
  const name = fullName(creditor)
  const groupLink = `${window.location.origin}/g/${groupId}`

  const markPaid = () =>
    create.mutate(
      { from: meId, to: t.to, amountCents: t.amountCents, createdBy: meId },
      {
        onSuccess: () => {
          toast('Pagamento registrado')
          onClose()
        },
      },
    )

  const header = (
    <div className="flex flex-col items-center gap-1">
      <div className="tabular text-[40px] font-extrabold tracking-[-0.045em] text-neg">{formatBRL(t.amountCents)}</div>
      <div className="flex items-center gap-2">
        <Avatar name={name} hue={creditor?.avatarHue ?? 170} size="sm" />
        <div className="text-sm text-ink2">
          para <b className="text-ink">{name}</b>
        </div>
      </div>
    </div>
  )

  const paidButton = (
    <>
      <FieldError>{create.isError ? friendlyError(create.error) : null}</FieldError>
      <Button loading={create.isPending} onClick={markPaid}>
        Marquei como pago
      </Button>
    </>
  )

  if (pix.isPending) {
    return (
      <>
        {header}
        <Skeleton className="size-[216px] self-center rounded-3xl" />
        <Skeleton className="h-3.5 w-40 self-center" />
        <Skeleton className="h-[54px] rounded-[18px]" />
      </>
    )
  }

  if (pix.isError) {
    return (
      <>
        {header}
        <p className="m-0 text-center text-sm text-ink2">{friendlyError(pix.error)}</p>
        <Button variant="secondary" className="h-[54px] text-[15px]" onClick={() => pix.refetch()}>
          Tentar de novo
        </Button>
      </>
    )
  }

  if (pix.data.status === 'denied') {
    return (
      <>
        {header}
        <p className="m-0 text-center text-sm leading-normal text-ink2">
          Esse acerto mudou desde que você abriu a tela. Fecha e confere a lista de novo.
        </p>
        <Button variant="secondary" className="h-[54px] text-[15px]" onClick={onClose}>
          Fechar
        </Button>
      </>
    )
  }

  if (pix.data.status === 'missing') {
    return (
      <>
        {header}
        <div className="flex flex-col items-center gap-2 rounded-3xl bg-surface2 px-5 py-6 text-center">
          <div className="text-[34px]" aria-hidden="true">
            🔑
          </div>
          <div className="text-base font-extrabold text-ink">{firstName(name)} ainda não cadastrou a chave Pix</div>
          <p className="m-0 text-[13px] leading-[1.45] text-ink2">Manda um lembrete pra cadastrar, ou combina outro jeito de pagar.</p>
        </div>
        <Button
          variant="whatsapp"
          onClick={() => openWhatsApp(askPixKeyMessage(firstName(name), t.amountCents, groupName, groupLink))}
        >
          Lembrar no WhatsApp
        </Button>
        {paidButton}
      </>
    )
  }

  const { key, type, displayName } = pix.data
  const payload = buildPixPayload({
    key,
    name: displayName ?? name,
    amountCents: t.amountCents,
    txid: pixTxid(groupId, t.to),
  })

  return (
    <>
      {header}
      <div className="size-[216px] flex-none self-center rounded-3xl bg-white p-3.5 shadow-[0_0_0_1px_rgba(0,0,0,.06)]">
        <QRCodeSVG
          value={payload}
          size={188}
          level="M"
          fgColor="#0B1211"
          bgColor="#FFFFFF"
          title={`QR Code Pix de ${formatBRL(t.amountCents)} para ${name}`}
          className="block size-full"
        />
      </div>
      <div className="text-center text-xs break-all text-ink2">Chave: {formatPixKey(type, key)}</div>
      <Button
        variant="secondary"
        className="h-[54px] rounded-[18px] text-[15px]"
        icon={<Copy size={18} strokeWidth={2.2} />}
        onClick={async () => {
          await copyText(payload)
          toast('Código Pix copiado')
        }}
      >
        Copiar Pix copia e cola
      </Button>
      {paidButton}
      <p className="m-0 text-center text-xs leading-[1.45] text-pretty text-ink2">
        Abre o app do seu banco, escolhe Pix e escaneia o QR ou cola o código.
      </p>
    </>
  )
}
