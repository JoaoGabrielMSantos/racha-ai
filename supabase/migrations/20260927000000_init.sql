-- =============================================================================
-- Racha Aí — migration inicial
-- Valores monetários SEMPRE em centavos (integer / bigint nas somas).
-- =============================================================================

create extension if not exists pgcrypto with schema extensions;

-- -----------------------------------------------------------------------------
-- Tabelas
-- -----------------------------------------------------------------------------

create table public.profiles (
  id            uuid primary key references auth.users (id) on delete cascade,
  display_name  text check (display_name is null or char_length(btrim(display_name)) between 1 and 40),
  avatar_hue    int  not null check (avatar_hue between 0 and 360),
  pix_key_type  text check (pix_key_type in ('cpf', 'phone', 'email', 'random')),
  pix_key       text,
  created_at    timestamptz not null default now(),
  -- tipo e chave andam juntos; a chave chega já normalizada pelo client
  constraint pix_key_pair check ((pix_key_type is null) = (pix_key is null)),
  constraint pix_key_format check (
    pix_key is null
    or (pix_key_type = 'cpf'    and pix_key ~ '^\d{11}$')
    or (pix_key_type = 'phone'  and pix_key ~ '^\+55\d{10,11}$')
    or (pix_key_type = 'email'  and pix_key ~ '^[^\s@A-Z]+@[^\s@A-Z]+\.[^\s@A-Z]+$' and char_length(pix_key) <= 77)
    or (pix_key_type = 'random' and pix_key ~ '^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$')
  )
);

-- 7 chars base62, gerado no banco
create or replace function public.gen_invite_code()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alphabet constant text := '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
  bytes bytea := extensions.gen_random_bytes(7);
  code  text := '';
begin
  for i in 0..6 loop
    -- 248 = 62*4: rejeita o resto para não enviesar
    while get_byte(bytes, i) >= 248 loop
      bytes := set_byte(bytes, i, get_byte(extensions.gen_random_bytes(1), 0));
    end loop;
    code := code || substr(alphabet, (get_byte(bytes, i) % 62) + 1, 1);
  end loop;
  return code;
end;
$$;

create table public.groups (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (char_length(btrim(name)) between 1 and 32),
  emoji        text not null default '🏖️' check (char_length(emoji) between 1 and 16),
  invite_code  text not null unique default public.gen_invite_code() check (invite_code ~ '^[0-9A-Za-z]{7}$'),
  created_by   uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  created_at   timestamptz not null default now()
);

create table public.group_members (
  group_id   uuid not null references public.groups (id) on delete cascade,
  user_id    uuid not null references public.profiles (id) on delete cascade,
  joined_at  timestamptz not null default now(),
  primary key (group_id, user_id)
);
create index group_members_user_idx on public.group_members (user_id);

create table public.expenses (
  id            uuid primary key default gen_random_uuid(),
  group_id      uuid not null references public.groups (id) on delete cascade,
  description   text not null check (char_length(btrim(description)) between 1 and 40),
  amount_cents  int  not null check (amount_cents > 0),
  paid_by       uuid not null references public.profiles (id),
  split_mode    text not null check (split_mode in ('equal', 'amount', 'some')),
  expense_date  date not null default current_date,
  created_by    uuid not null default auth.uid() references public.profiles (id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index expenses_group_date_idx on public.expenses (group_id, expense_date desc, created_at desc);

create table public.expense_splits (
  expense_id    uuid not null references public.expenses (id) on delete cascade,
  user_id       uuid not null references public.profiles (id),
  amount_cents  int  not null check (amount_cents >= 0),
  primary key (expense_id, user_id)
);
create index expense_splits_user_idx on public.expense_splits (user_id);

create table public.settlements (
  id            uuid primary key default gen_random_uuid(),
  group_id      uuid not null references public.groups (id) on delete cascade,
  from_user     uuid not null references public.profiles (id),
  to_user       uuid not null references public.profiles (id),
  amount_cents  int  not null check (amount_cents > 0),
  created_by    uuid not null default auth.uid() references public.profiles (id),
  paid_at       timestamptz not null default now(),
  created_at    timestamptz not null default now(),
  constraint settlement_distinct_users check (from_user <> to_user)
);
create index settlements_group_idx on public.settlements (group_id, paid_at desc);

-- -----------------------------------------------------------------------------
-- Helpers usados nas policies (SECURITY DEFINER evita recursão de RLS)
-- -----------------------------------------------------------------------------

create or replace function public.is_group_member(gid uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.group_members m
    where m.group_id = gid and m.user_id = auth.uid()
  );
$$;

-- "divide algum grupo comigo?" — visibilidade de perfis
create or replace function public.shares_group_with(other uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.group_members a
    join public.group_members b on b.group_id = a.group_id
    where a.user_id = auth.uid() and b.user_id = other
  );
$$;

-- saldo de um usuário num grupo (interno; não exposto ao client)
create or replace function public.member_balance(gid uuid, uid uuid)
returns bigint
language sql
stable
security definer
set search_path = ''
as $$
  select
      coalesce((select sum(e.amount_cents) from public.expenses e
                where e.group_id = gid and e.paid_by = uid), 0)
    - coalesce((select sum(s.amount_cents) from public.expense_splits s
                join public.expenses e on e.id = s.expense_id
                where e.group_id = gid and s.user_id = uid), 0)
    + coalesce((select sum(t.amount_cents) from public.settlements t
                where t.group_id = gid and t.from_user = uid), 0)
    - coalesce((select sum(t.amount_cents) from public.settlements t
                where t.group_id = gid and t.to_user = uid), 0);
$$;

-- -----------------------------------------------------------------------------
-- Triggers
-- -----------------------------------------------------------------------------

-- auth.users insert → profile (hue estável derivado do id)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, avatar_hue)
  values (new.id, ((hashtext(new.id::text)::bigint % 360) + 360) % 360)
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- groups insert → criador vira membro
create or replace function public.handle_new_group()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.group_members (group_id, user_id)
  values (new.id, new.created_by)
  on conflict do nothing;
  return new;
end;
$$;

create trigger on_group_created
  after insert on public.groups
  for each row execute function public.handle_new_group();

-- updated_at
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger expenses_touch_updated_at
  before update on public.expenses
  for each row execute function public.touch_updated_at();

-- Consistência do gasto, checada no COMMIT (deferred):
--   soma dos splits = amount_cents; paid_by e todos os user_id dos splits são membros.
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
  eid := case when tg_table_name = 'expenses' then new.id
              else coalesce(new.expense_id, old.expense_id) end;

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

create constraint trigger expenses_consistency
  after insert or update on public.expenses
  deferrable initially deferred
  for each row execute function public.check_expense_consistency();

create constraint trigger expense_splits_consistency
  after insert or update or delete on public.expense_splits
  deferrable initially deferred
  for each row execute function public.check_expense_consistency();

-- Settlement só entre membros
create or replace function public.check_settlement_members()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not exists (select 1 from public.group_members where group_id = new.group_id and user_id = new.from_user)
     or not exists (select 1 from public.group_members where group_id = new.group_id and user_id = new.to_user) then
    raise exception 'Pagamento entre pessoas de fora do grupo' using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

create trigger settlements_members
  before insert on public.settlements
  for each row execute function public.check_settlement_members();

-- -----------------------------------------------------------------------------
-- RLS
-- -----------------------------------------------------------------------------

alter table public.profiles       enable row level security;
alter table public.groups         enable row level security;
alter table public.group_members  enable row level security;
alter table public.expenses       enable row level security;
alter table public.expense_splits enable row level security;
alter table public.settlements    enable row level security;

-- GRANTs explícitos: não depender da exposição automática do Data API.
grant select, insert        on public.groups         to authenticated;
grant select                on public.group_members  to authenticated;
grant select, insert, delete on public.expenses       to authenticated;
grant select, insert, delete on public.expense_splits to authenticated;
grant select, insert, delete on public.settlements    to authenticated;

-- Nada para anon.
revoke all on public.profiles, public.groups, public.group_members,
              public.expenses, public.expense_splits, public.settlements from anon;

-- profiles: pix_key NÃO é legível via API (column privileges).
--   dono lê a própria chave via get_my_profile(); outros via get_pix_key().
revoke all on public.profiles from authenticated;
grant select (id, display_name, avatar_hue, created_at) on public.profiles to authenticated;
grant update (display_name, pix_key_type, pix_key)       on public.profiles to authenticated;

create policy profiles_select on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or public.shares_group_with(id));

create policy profiles_update on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- groups: o client gera o uuid (crypto.randomUUID) e insere com return=minimal,
-- porque o RETURNING seria checado antes do trigger que cria a membership.
revoke update, delete, truncate on public.groups from authenticated;
grant update (name, emoji) on public.groups to authenticated;

create policy groups_select on public.groups
  for select to authenticated
  using (public.is_group_member(id));

create policy groups_insert on public.groups
  for insert to authenticated
  with check (created_by = (select auth.uid()));

create policy groups_update on public.groups
  for update to authenticated
  using (public.is_group_member(id))
  with check (public.is_group_member(id));

-- group_members: sem INSERT/DELETE direto. Entrada só via trigger (criador) e
-- join_group(); saída só via leave_group() (que checa saldo 0).
revoke insert, update, delete, truncate on public.group_members from authenticated;

create policy group_members_select on public.group_members
  for select to authenticated
  using (public.is_group_member(group_id));

-- expenses
revoke update, truncate on public.expenses from authenticated;
grant update (description, amount_cents, paid_by, split_mode, expense_date) on public.expenses to authenticated;

create policy expenses_select on public.expenses
  for select to authenticated
  using (public.is_group_member(group_id));

create policy expenses_insert on public.expenses
  for insert to authenticated
  with check (public.is_group_member(group_id) and created_by = (select auth.uid()));

create policy expenses_update on public.expenses
  for update to authenticated
  using (public.is_group_member(group_id) and (created_by = (select auth.uid()) or paid_by = (select auth.uid())))
  with check (public.is_group_member(group_id) and (created_by = (select auth.uid()) or paid_by = (select auth.uid())));

create policy expenses_delete on public.expenses
  for delete to authenticated
  using (public.is_group_member(group_id) and (created_by = (select auth.uid()) or paid_by = (select auth.uid())));

-- expense_splits: lê quem é membro; escreve quem pode editar o gasto-pai
revoke update, truncate on public.expense_splits from authenticated;

create policy expense_splits_select on public.expense_splits
  for select to authenticated
  using (exists (select 1 from public.expenses e
                 where e.id = expense_id and public.is_group_member(e.group_id)));

create policy expense_splits_insert on public.expense_splits
  for insert to authenticated
  with check (exists (select 1 from public.expenses e
                      where e.id = expense_id
                        and public.is_group_member(e.group_id)
                        and (e.created_by = (select auth.uid()) or e.paid_by = (select auth.uid()))));

create policy expense_splits_delete on public.expense_splits
  for delete to authenticated
  using (exists (select 1 from public.expenses e
                 where e.id = expense_id
                   and public.is_group_member(e.group_id)
                   and (e.created_by = (select auth.uid()) or e.paid_by = (select auth.uid()))));

-- settlements: qualquer membro registra (inclusive entre terceiros);
-- desfazer: created_by, from_user ou to_user.
revoke update, truncate on public.settlements from authenticated;

create policy settlements_select on public.settlements
  for select to authenticated
  using (public.is_group_member(group_id));

create policy settlements_insert on public.settlements
  for insert to authenticated
  with check (public.is_group_member(group_id) and created_by = (select auth.uid()));

create policy settlements_delete on public.settlements
  for delete to authenticated
  using (public.is_group_member(group_id)
         and (select auth.uid()) in (created_by, from_user, to_user));

-- -----------------------------------------------------------------------------
-- RPCs
-- -----------------------------------------------------------------------------

-- Perfil do próprio usuário, com a chave Pix
create or replace function public.get_my_profile()
returns table (id uuid, display_name text, avatar_hue int, pix_key_type text, pix_key text)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.display_name, p.avatar_hue, p.pix_key_type, p.pix_key
  from public.profiles p
  where p.id = auth.uid();
$$;

-- Cria ou atualiza gasto + splits numa transação.
-- SECURITY INVOKER: as policies de expenses/expense_splits valem normalmente.
-- payload: { id?, group_id, description, amount_cents, paid_by, split_mode,
--            expense_date, splits: [{ user_id, amount_cents }] }
create or replace function public.save_expense(payload jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  eid uuid := nullif(payload->>'id', '')::uuid;
begin
  if jsonb_typeof(payload->'splits') is distinct from 'array' then
    raise exception 'splits ausente' using errcode = 'invalid_parameter_value';
  end if;

  if eid is null then
    insert into public.expenses (group_id, description, amount_cents, paid_by, split_mode, expense_date, created_by)
    values (
      (payload->>'group_id')::uuid,
      btrim(payload->>'description'),
      (payload->>'amount_cents')::int,
      (payload->>'paid_by')::uuid,
      payload->>'split_mode',
      coalesce((payload->>'expense_date')::date, current_date),
      auth.uid()
    )
    returning id into eid;
  else
    update public.expenses set
      description  = btrim(payload->>'description'),
      amount_cents = (payload->>'amount_cents')::int,
      paid_by      = (payload->>'paid_by')::uuid,
      split_mode   = payload->>'split_mode',
      expense_date = coalesce((payload->>'expense_date')::date, expense_date)
    where id = eid;

    if not found then
      raise exception 'Gasto não encontrado ou sem permissão' using errcode = 'insufficient_privilege';
    end if;

    delete from public.expense_splits where expense_id = eid;
  end if;

  insert into public.expense_splits (expense_id, user_id, amount_cents)
  select eid, (s->>'user_id')::uuid, (s->>'amount_cents')::int
  from jsonb_array_elements(payload->'splits') s
  where (s->>'amount_cents')::int > 0;

  return eid;
end;
$$;

-- Entrar via convite (idempotente)
create or replace function public.join_group(code text)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  gid uuid;
begin
  if auth.uid() is null then
    raise exception 'Não autenticado' using errcode = 'insufficient_privilege';
  end if;

  select id into gid from public.groups where invite_code = code;
  if gid is null then
    raise exception 'Convite inválido' using errcode = 'no_data_found';
  end if;

  insert into public.group_members (group_id, user_id)
  values (gid, auth.uid())
  on conflict do nothing;

  return gid;
end;
$$;

-- Sair do grupo (só com saldo 0). Último a sair apaga o grupo.
create or replace function public.leave_group(gid uuid)
returns void
language plpgsql
volatile
security definer
set search_path = ''
as $$
begin
  if not public.is_group_member(gid) then
    raise exception 'Você não é membro deste grupo' using errcode = 'insufficient_privilege';
  end if;

  if public.member_balance(gid, auth.uid()) <> 0 then
    raise exception 'Acerta suas contas antes de sair' using errcode = 'check_violation';
  end if;

  delete from public.group_members where group_id = gid and user_id = auth.uid();

  if not exists (select 1 from public.group_members where group_id = gid) then
    delete from public.groups where id = gid;
  end if;
end;
$$;

-- Home: todos os grupos do usuário com contadores e saldo, numa chamada.
create or replace function public.my_groups_summary()
returns table (
  id               uuid,
  name             text,
  emoji            text,
  member_count     int,
  expense_count    int,
  total_cents      bigint,
  my_balance_cents bigint,
  last_activity_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    g.id, g.name, g.emoji,
    (select count(*)::int from public.group_members m where m.group_id = g.id),
    (select count(*)::int from public.expenses e where e.group_id = g.id),
    (select coalesce(sum(e.amount_cents), 0)::bigint from public.expenses e where e.group_id = g.id),
    public.member_balance(g.id, auth.uid()),
    greatest(
      g.created_at,
      (select max(e.created_at) from public.expenses e where e.group_id = g.id),
      (select max(s.created_at) from public.settlements s where s.group_id = g.id)
    )
  from public.groups g
  join public.group_members me on me.group_id = g.id and me.user_id = auth.uid()
  order by 8 desc;
$$;

-- Chave Pix do credor: só para quem deve (saldo < 0) a um credor (saldo > 0) no grupo.
-- Retorna null quando não autorizado; pix_key null = credor sem chave cadastrada.
create or replace function public.get_pix_key(creditor uuid, gid uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  p public.profiles%rowtype;
begin
  if not public.is_group_member(gid)
     or not exists (select 1 from public.group_members where group_id = gid and user_id = creditor)
     or public.member_balance(gid, auth.uid()) >= 0
     or public.member_balance(gid, creditor) <= 0 then
    return null;
  end if;

  select * into p from public.profiles where id = creditor;
  return jsonb_build_object(
    'display_name', p.display_name,
    'pix_key_type', p.pix_key_type,
    'pix_key',      p.pix_key
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- Permissões de execução
-- -----------------------------------------------------------------------------

revoke execute on all functions in schema public from public, anon;

-- internas (usadas só dentro de funções/policies security definer)
revoke execute on function public.member_balance(uuid, uuid)   from authenticated;
revoke execute on function public.handle_new_user()            from authenticated;
revoke execute on function public.handle_new_group()           from authenticated;
revoke execute on function public.check_expense_consistency()  from authenticated;
revoke execute on function public.check_settlement_members()   from authenticated;
revoke execute on function public.touch_updated_at()           from authenticated;

-- usadas nas policies (avaliadas como o usuário) + RPCs públicas
grant execute on function public.is_group_member(uuid)         to authenticated;
grant execute on function public.shares_group_with(uuid)       to authenticated;
grant execute on function public.get_my_profile()              to authenticated;
grant execute on function public.save_expense(jsonb)           to authenticated;
grant execute on function public.join_group(text)              to authenticated;
grant execute on function public.leave_group(uuid)             to authenticated;
grant execute on function public.my_groups_summary()           to authenticated;
grant execute on function public.get_pix_key(uuid, uuid)       to authenticated;

-- default de groups.invite_code roda com os privilégios de quem insere
grant execute on function public.gen_invite_code() to authenticated;

-- -----------------------------------------------------------------------------
-- Realtime
-- -----------------------------------------------------------------------------

alter publication supabase_realtime add table
  public.expenses, public.expense_splits, public.settlements, public.group_members;
