-- KOSHORA APP MIGRATION
-- Prerequisite: database/hub_onboarding.sql has registered app/schema koshora.
-- This migration intentionally modifies only koshora.* objects.

select hub.assert_app_scope('koshora', 'koshora');

revoke all on schema koshora from public, anon, authenticated, service_role;
grant usage on schema koshora to authenticated;

alter default privileges for role postgres in schema koshora
  revoke all on tables from public, anon, authenticated, service_role;
alter default privileges for role postgres in schema koshora
  revoke all on sequences from public, anon, authenticated, service_role;
alter default privileges for role postgres in schema koshora
  revoke execute on functions from public, anon, authenticated, service_role;

create table if not exists koshora.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  currency text not null default 'INR' check (char_length(currency) = 3),
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists koshora.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  slug text not null,
  name text not null check (char_length(name) between 1 and 60),
  kind text not null check (kind in ('expense','income')),
  icon text not null default 'Ot',
  accent text not null default '#dedede',
  created_at timestamptz not null default now(),
  unique (id, user_id),
  unique (user_id, slug)
);

create table if not exists koshora.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  type text not null check (type in ('cash','bank','credit','wallet','savings')),
  opening_balance numeric(14,2) not null default 0,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create table if not exists koshora.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('expense','income','transfer')),
  amount numeric(14,2) not null check (amount > 0),
  description text not null check (char_length(description) between 1 and 160),
  note text check (note is null or char_length(note) <= 500),
  category_id uuid,
  account_id uuid not null,
  to_account_id uuid,
  occurred_on date not null,
  is_recurring boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint transactions_category_owner_fk
    foreign key (category_id, user_id)
    references koshora.categories(id, user_id) on delete restrict,
  constraint transactions_account_owner_fk
    foreign key (account_id, user_id)
    references koshora.accounts(id, user_id) on delete restrict,
  constraint transactions_to_account_owner_fk
    foreign key (to_account_id, user_id)
    references koshora.accounts(id, user_id) on delete restrict,
  constraint transfer_shape check (
    (type = 'transfer' and category_id is null and to_account_id is not null and to_account_id <> account_id)
    or (type <> 'transfer' and to_account_id is null)
  )
);

create table if not exists koshora.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null,
  month_start date not null check (month_start = date_trunc('month', month_start)::date),
  amount_limit numeric(14,2) not null check (amount_limit > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint budgets_category_owner_fk
    foreign key (category_id, user_id)
    references koshora.categories(id, user_id) on delete restrict,
  unique (user_id, category_id, month_start)
);

create table if not exists koshora.recurring_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  amount numeric(14,2) not null check (amount > 0),
  type text not null check (type in ('expense','income')),
  category_id uuid,
  account_id uuid not null,
  next_date date not null,
  frequency text not null check (frequency in ('weekly','monthly','yearly')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recurring_category_owner_fk
    foreign key (category_id, user_id)
    references koshora.categories(id, user_id) on delete restrict,
  constraint recurring_account_owner_fk
    foreign key (account_id, user_id)
    references koshora.accounts(id, user_id) on delete restrict
);

create table if not exists koshora.savings_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  current_amount numeric(14,2) not null default 0 check (current_amount >= 0),
  target_amount numeric(14,2) not null check (target_amount > 0),
  target_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (current_amount <= target_amount)
);

create index if not exists transactions_user_date_idx
  on koshora.transactions(user_id, occurred_on desc);
create index if not exists transactions_user_category_idx
  on koshora.transactions(user_id, category_id, occurred_on desc);
create index if not exists transactions_user_account_idx
  on koshora.transactions(user_id, account_id, occurred_on desc);
create index if not exists budgets_user_month_idx
  on koshora.budgets(user_id, month_start desc);
create index if not exists recurring_user_next_idx
  on koshora.recurring_transactions(user_id, active, next_date);

create or replace function koshora.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger profiles_set_updated_at
  before update on koshora.profiles
  for each row execute function koshora.set_updated_at();
create or replace trigger accounts_set_updated_at
  before update on koshora.accounts
  for each row execute function koshora.set_updated_at();
create or replace trigger transactions_set_updated_at
  before update on koshora.transactions
  for each row execute function koshora.set_updated_at();
create or replace trigger budgets_set_updated_at
  before update on koshora.budgets
  for each row execute function koshora.set_updated_at();
create or replace trigger recurring_set_updated_at
  before update on koshora.recurring_transactions
  for each row execute function koshora.set_updated_at();
create or replace trigger goals_set_updated_at
  before update on koshora.savings_goals
  for each row execute function koshora.set_updated_at();

-- Narrow self-enrollment RPC. It can create only the caller's Koshora membership.
-- Existing disabled memberships are never reactivated by this function.
create or replace function koshora.koshora_join_current_user()
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_app_id uuid;
begin
  if v_user_id is null then
    raise exception 'Authentication required' using errcode = '42501';
  end if;

  select a.id
    into v_app_id
  from hub.apps a
  where a.slug = 'koshora'
    and a.schema_name = 'koshora'
    and a.status in ('planned', 'active')
  limit 1;

  if v_app_id is null then
    raise exception 'Koshora is not active in Project Hub';
  end if;

  insert into hub.app_memberships (app_id, user_id, app_role, state)
  values (v_app_id, v_user_id, 'member', 'active')
  on conflict (app_id, user_id) do nothing;

  return exists (
    select 1
    from hub.app_memberships m
    where m.app_id = v_app_id
      and m.user_id = v_user_id
      and m.state = 'active'
  );
end;
$$;

revoke all on function koshora.set_updated_at() from public, anon, authenticated, service_role;
revoke all on function koshora.koshora_join_current_user() from public, anon, authenticated, service_role;
grant execute on function koshora.koshora_join_current_user() to authenticated;

alter table koshora.profiles enable row level security;
alter table koshora.categories enable row level security;
alter table koshora.accounts enable row level security;
alter table koshora.transactions enable row level security;
alter table koshora.budgets enable row level security;
alter table koshora.recurring_transactions enable row level security;
alter table koshora.savings_goals enable row level security;

revoke all on all tables in schema koshora from public, anon, authenticated, service_role;
revoke all on all sequences in schema koshora from public, anon, authenticated, service_role;

grant select, insert, update, delete on koshora.profiles to authenticated;
grant select, insert, update, delete on koshora.categories to authenticated;
grant select, insert, update, delete on koshora.accounts to authenticated;
grant select, insert, update, delete on koshora.transactions to authenticated;
grant select, insert, update, delete on koshora.budgets to authenticated;
grant select, insert, update, delete on koshora.recurring_transactions to authenticated;
grant select, insert, update, delete on koshora.savings_goals to authenticated;

-- Profiles use id itself as the owner identifier.
create policy "profiles_select_member_own" on koshora.profiles
  for select to authenticated
  using ((select hub.current_user_has_app('koshora')) and (select auth.uid()) = id);
create policy "profiles_insert_member_own" on koshora.profiles
  for insert to authenticated
  with check ((select hub.current_user_has_app('koshora')) and (select auth.uid()) = id);
create policy "profiles_update_member_own" on koshora.profiles
  for update to authenticated
  using ((select hub.current_user_has_app('koshora')) and (select auth.uid()) = id)
  with check ((select hub.current_user_has_app('koshora')) and (select auth.uid()) = id);
create policy "profiles_delete_member_own" on koshora.profiles
  for delete to authenticated
  using ((select hub.current_user_has_app('koshora')) and (select auth.uid()) = id);

create policy "categories_select_member_own" on koshora.categories
  for select to authenticated
  using ((select hub.current_user_has_app('koshora')) and (select auth.uid()) = user_id);
create policy "categories_insert_member_own" on koshora.categories
  for insert to authenticated
  with check ((select hub.current_user_has_app('koshora')) and (select auth.uid()) = user_id);
create policy "categories_update_member_own" on koshora.categories
  for update to authenticated
  using ((select hub.current_user_has_app('koshora')) and (select auth.uid()) = user_id)
  with check ((select hub.current_user_has_app('koshora')) and (select auth.uid()) = user_id);
create policy "categories_delete_member_own" on koshora.categories
  for delete to authenticated
  using ((select hub.current_user_has_app('koshora')) and (select auth.uid()) = user_id);

create policy "accounts_select_member_own" on koshora.accounts
  for select to authenticated
  using ((select hub.current_user_has_app('koshora')) and (select auth.uid()) = user_id);
create policy "accounts_insert_member_own" on koshora.accounts
  for insert to authenticated
  with check ((select hub.current_user_has_app('koshora')) and (select auth.uid()) = user_id);
create policy "accounts_update_member_own" on koshora.accounts
  for update to authenticated
  using ((select hub.current_user_has_app('koshora')) and (select auth.uid()) = user_id)
  with check ((select hub.current_user_has_app('koshora')) and (select auth.uid()) = user_id);
create policy "accounts_delete_member_own" on koshora.accounts
  for delete to authenticated
  using ((select hub.current_user_has_app('koshora')) and (select auth.uid()) = user_id);

create policy "transactions_select_member_own" on koshora.transactions
  for select to authenticated
  using ((select hub.current_user_has_app('koshora')) and (select auth.uid()) = user_id);
create policy "transactions_insert_member_own" on koshora.transactions
  for insert to authenticated
  with check ((select hub.current_user_has_app('koshora')) and (select auth.uid()) = user_id);
create policy "transactions_update_member_own" on koshora.transactions
  for update to authenticated
  using ((select hub.current_user_has_app('koshora')) and (select auth.uid()) = user_id)
  with check ((select hub.current_user_has_app('koshora')) and (select auth.uid()) = user_id);
create policy "transactions_delete_member_own" on koshora.transactions
  for delete to authenticated
  using ((select hub.current_user_has_app('koshora')) and (select auth.uid()) = user_id);

create policy "budgets_select_member_own" on koshora.budgets
  for select to authenticated
  using ((select hub.current_user_has_app('koshora')) and (select auth.uid()) = user_id);
create policy "budgets_insert_member_own" on koshora.budgets
  for insert to authenticated
  with check ((select hub.current_user_has_app('koshora')) and (select auth.uid()) = user_id);
create policy "budgets_update_member_own" on koshora.budgets
  for update to authenticated
  using ((select hub.current_user_has_app('koshora')) and (select auth.uid()) = user_id)
  with check ((select hub.current_user_has_app('koshora')) and (select auth.uid()) = user_id);
create policy "budgets_delete_member_own" on koshora.budgets
  for delete to authenticated
  using ((select hub.current_user_has_app('koshora')) and (select auth.uid()) = user_id);

create policy "recurring_select_member_own" on koshora.recurring_transactions
  for select to authenticated
  using ((select hub.current_user_has_app('koshora')) and (select auth.uid()) = user_id);
create policy "recurring_insert_member_own" on koshora.recurring_transactions
  for insert to authenticated
  with check ((select hub.current_user_has_app('koshora')) and (select auth.uid()) = user_id);
create policy "recurring_update_member_own" on koshora.recurring_transactions
  for update to authenticated
  using ((select hub.current_user_has_app('koshora')) and (select auth.uid()) = user_id)
  with check ((select hub.current_user_has_app('koshora')) and (select auth.uid()) = user_id);
create policy "recurring_delete_member_own" on koshora.recurring_transactions
  for delete to authenticated
  using ((select hub.current_user_has_app('koshora')) and (select auth.uid()) = user_id);

create policy "goals_select_member_own" on koshora.savings_goals
  for select to authenticated
  using ((select hub.current_user_has_app('koshora')) and (select auth.uid()) = user_id);
create policy "goals_insert_member_own" on koshora.savings_goals
  for insert to authenticated
  with check ((select hub.current_user_has_app('koshora')) and (select auth.uid()) = user_id);
create policy "goals_update_member_own" on koshora.savings_goals
  for update to authenticated
  using ((select hub.current_user_has_app('koshora')) and (select auth.uid()) = user_id)
  with check ((select hub.current_user_has_app('koshora')) and (select auth.uid()) = user_id);
create policy "goals_delete_member_own" on koshora.savings_goals
  for delete to authenticated
  using ((select hub.current_user_has_app('koshora')) and (select auth.uid()) = user_id);
