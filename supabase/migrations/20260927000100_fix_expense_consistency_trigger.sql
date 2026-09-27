-- Corrige check_expense_consistency(): o CASE fazia o PL/pgSQL resolver new.expense_id
-- também quando o trigger dispara em public.expenses (que não tem essa coluna).
create or replace function public.check_expense_consistency()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  eid uuid;
  e   public.expenses%rowtype;
  total bigint;
begin
  if tg_table_name = 'expenses' then
    eid := new.id;
  elsif tg_op = 'DELETE' then
    eid := old.expense_id;
  else
    eid := new.expense_id;
  end if;

  select * into e from public.expenses where id = eid;
  if not found then
    return null; -- gasto apagado (cascade); nada a checar
  end if;

  select coalesce(sum(amount_cents), 0) into total
  from public.expense_splits where expense_id = eid;

  if total <> e.amount_cents then
    raise exception 'A soma das partes (%) não fecha com o valor do gasto (%)', total, e.amount_cents
      using errcode = 'check_violation';
  end if;

  if not exists (select 1 from public.group_members
                 where group_id = e.group_id and user_id = e.paid_by) then
    raise exception 'Quem pagou não é membro do grupo' using errcode = 'check_violation';
  end if;

  if exists (select 1 from public.expense_splits s
             where s.expense_id = eid
               and not exists (select 1 from public.group_members m
                               where m.group_id = e.group_id and m.user_id = s.user_id)) then
    raise exception 'Alguém da divisão não é membro do grupo' using errcode = 'check_violation';
  end if;

  return null;
end;
$$;

revoke execute on function public.check_expense_consistency() from public, anon, authenticated;
