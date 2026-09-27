import { useNavigate } from 'react-router'
import { LogOut, UserPlus } from 'lucide-react'
import { friendlyError } from '@/api/errors'
import { useLeaveGroup } from '@/api/groups'
import { BottomSheet } from '@/components/BottomSheet'
import { Button } from '@/components/Button'
import { FieldError } from '@/components/Input'
import { useToast } from '@/components/toast-context'

type Props = { open: boolean; onClose: () => void; groupId: string; groupName: string }

/**
 * Menu ⋯ do grupo. Sair só é permitido com saldo 0 — o banco (leave_group) é quem decide
 * e devolve "Acerta suas contas antes de sair".
 */
export function GroupMenuSheet({ open, onClose, groupId, groupName }: Props) {
  const navigate = useNavigate()
  const toast = useToast()
  const leave = useLeaveGroup()

  const close = () => {
    leave.reset()
    onClose()
  }

  return (
    <BottomSheet open={open} title={groupName} onClose={close}>
      <Button
        variant="secondary"
        className="h-[54px] justify-start gap-3 px-[18px] text-[15px]"
        icon={<UserPlus size={20} strokeWidth={2.2} />}
        onClick={() => navigate(`/g/${groupId}/convite`)}
      >
        Convidar pessoas
      </Button>
      <div className="flex flex-col gap-2 rounded-[22px] bg-surface2 p-4">
        <div className="text-[15px] font-bold text-ink">Sair do grupo</div>
        <p className="m-0 text-[13px] leading-[1.45] text-ink2">
          Você deixa de ver os gastos de {groupName}. Pra voltar, precisa de um novo convite. Só dá pra sair com as contas
          acertadas.
        </p>
        <FieldError>
          {leave.isError
            ? (leave.error as { code?: string }).code === '23514'
              ? 'Acerta suas contas antes de sair'
              : friendlyError(leave.error)
            : null}
        </FieldError>
        <Button
          variant="negSoft"
          size="sm"
          className="mt-1"
          icon={<LogOut size={18} strokeWidth={2.2} />}
          loading={leave.isPending}
          onClick={() =>
            leave.mutate(groupId, {
              onSuccess: () => {
                toast('Você saiu do grupo')
                navigate('/', { replace: true })
              },
            })
          }
        >
          Sair do grupo
        </Button>
      </div>
    </BottomSheet>
  )
}
