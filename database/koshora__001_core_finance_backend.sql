-- KOSHORA APP #2 — CORE FINANCE BACKEND
-- Migration key: koshora__001_core_finance_backend
-- Project Hub architecture v2
--
-- PRECONDITIONS
--   1. hub.read_me_first exists and architecture_version >= 2
--   2. Koshora is registered as App #2 with schema koshora
--   3. Repository contains AGENTS.md and SUPABASE_HUB_RULES.md
--   4. hub.assert_app_scope('koshora', 'koshora') succeeds
--
-- SAFETY
--   * Creates/modifies application objects only in koshora.*
--   * Reads shared auth.users only through foreign-key ownership references
--   * Writes hub.* only for Koshora membership/resource/version/audit metadata
--   * Does not modify Auralis or any other application schema
--   * Does not change project-wide Auth, Storage, API exposure, keys, billing or region
--   * Enables RLS on every user-facing table before client access is granted

begin;

select * from hub.read_me_first;
select hub.assert_app_scope('koshora', 'koshora');

-- Refuse to proceed if the registered App #2 contract is not exact.
do $$
begin
  if not exists (
    select 1
    from hub.apps
    where app_number = 2
      and slug = 'koshora'
      and schema_name = 'koshora'
      and status = 'planned'
      and safety_contract_version = 2
      and safety_contract_acknowledged_at is not null
  ) then
    raise exception 'Koshora backend stopped: expected planned App #2 registration was not found';
  end if;
end;
$$;

-- Keep schema access deny-by-default, then grant only what Koshora needs.
revoke all on schema koshora from public, anon, authenticated, service_role;
grant usage on schema koshora to authenticated;

alter default privileges for role postgres in schema koshora
  revoke all on tables from public, anon, authenticated, service_role;
alter default privileges for role postgres in schema koshora
  revoke all on sequences from public, anon, authenticated, service_role;
alter default privileges for role postgres in schema koshora
  revoke execute on functions from public, anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 1. Core user tables
-- ---------------------------------------------------------------------------

create table koshora.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  currency text not null default 'INR' check (char_length(currency) = 3),
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table koshora.categories (
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

create table koshora.accounts (
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

create table koshora.transactions (
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

create table koshora.budgets (
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

create table koshora.recurring_transactions (
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

create table koshora.savings_goals (
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

-- ---------------------------------------------------------------------------
-- 2. Indexes
-- ---------------------------------------------------------------------------

create index transactions_user_date_idx
  on koshora.transactions(user_id, occurred_on desc);
create index transactions_user_category_idx
  on koshora.transactions(user_id, category_id, occurred_on desc);
create index transactions_user_account_idx
  on koshora.transactions(user_id, account_id, occurred_on desc);
create index budgets_user_month_idx
  on koshora.budgets(user_id, month_start desc);
create index recurring_user_next_idx
  on koshora.recurring_transactions(user_id, active, next_date);

-- ---------------------------------------------------------------------------
-- 3. Utility trigger
-- ---------------------------------------------------------------------------

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

revoke all on function koshora.set_updated_at()
  from public, anon, authenticated, service_role;

create trigger profiles_set_updated_at
  before update on koshora.profiles
  for each row execute function koshora.set_updated_at();
create trigger accounts_set_updated_at
  before update on koshora.accounts
  for each row execute function koshora.set_updated_at();
create trigger transactions_set_updated_at
  before update on koshora.transactions
  for each row execute function koshora.set_updated_at();
create trigger budgets_set_updated_at
  before update on koshora.budgets
  for each row execute function koshora.set_updated_at();
create trigger recurring_set_updated_at
  before update on koshora.recurring_transactions
  for each row execute function koshora.set_updated_at();
create trigger goals_set_updated_at
  before update on koshora.savings_goals
  for each row execute function koshora.set_updated_at();

-- ---------------------------------------------------------------------------
-- 4. Narrow Koshora-only self-membership RPC
-- ---------------------------------------------------------------------------

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
  where a.app_number = 2
    and a.slug = 'koshora'
    and a.schema_name = 'koshora'
    and a.status in ('planned', 'active')
  limit 1;

  if v_app_id is null then
    raise exception 'Koshora is not registered as Project Hub App #2';
  end if;

  insert into hub.app_memberships (
    app_id,
    user_id,
    app_role,
    state,
    metadata
  ) values (
    v_app_id,
    v_user_id,
    'member',
    'active',
    jsonb_build_object('joined_via', 'koshora.koshora_join_current_user')
  )
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

revoke all on function koshora.koshora_join_current_user()
  from public, anon, service_role;
grant execute on function koshora.koshora_join_current_user()
  to authenticated;

-- ---------------------------------------------------------------------------
-- 5. RLS — membership AND row ownership
-- ---------------------------------------------------------------------------

alter table koshora.profiles enable row level security;
alter table koshora.categories enable row level security;
alter table koshora.accounts enable row level security;
alter table koshora.transactions enable row level security;
alter table koshora.budgets enable row level security;
alter table koshora.recurring_transactions enable row level security;
alter table koshora.savings_goals enable row level security;

create policy profiles_select_member_own on koshora.profiles
  for select to authenticated
  using (hub.current_user_has_app('koshora') and auth.uid() = id);
create policy profiles_insert_member_own on koshora.profiles
  for insert to authenticated
  with check (hub.current_user_has_app('koshora') and auth.uid() = id);
create policy profiles_update_member_own on koshora.profiles
  for update to authenticated
  using (hub.current_user_has_app('koshora') and auth.uid() = id)
  with check (hub.current_user_has_app('koshora') and auth.uid() = id);
create policy profiles_delete_member_own on koshora.profiles
  for delete to authenticated
  using (hub.current_user_has_app('koshora') and auth.uid() = id);

create policy categories_select_member_own on koshora.categories
  for select to authenticated
  using (hub.current_user_has_app('koshora') and auth.uid() = user_id);
create policy categories_insert_member_own on koshora.categories
  for insert to authenticated
  with check (hub.current_user_has_app('koshora') and auth.uid() = user_id);
create policy categories_update_member_own on koshora.categories
  for update to authenticated
  using (hub.current_user_has_app('koshora') and auth.uid() = user_id)
  with check (hub.current_user_has_app('koshora') and auth.uid() = user_id);
create policy categories_delete_member_own on koshora.categories
  for delete to authenticated
  using (hub.current_user_has_app('koshora') and auth.uid() = user_id);

create policy accounts_select_member_own on koshora.accounts
  for select to authenticated
  using (hub.current_user_has_app('koshora') and auth.uid() = user_id);
create policy accounts_insert_member_own on koshora.accounts
  for insert to authenticated
  with check (hub.current_user_has_app('koshora') and auth.uid() = user_id);
create policy accounts_update_member_own on koshora.accounts
  for update to authenticated
  using (hub.current_user_has_app('koshora') and auth.uid() = user_id)
  with check (hub.current_user_has_app('koshora') and auth.uid() = user_id);
create policy accounts_delete_member_own on koshora.accounts
  for delete to authenticated
  using (hub.current_user_has_app('koshora') and auth.uid() = user_id);

create policy transactions_select_member_own on koshora.transactions
  for select to authenticated
  using (hub.current_user_has_app('koshora') and auth.uid() = user_id);
create policy transactions_insert_member_own on koshora.transactions
  for insert to authenticated
  with check (hub.current_user_has_app('koshora') and auth.uid() = user_id);
create policy transactions_update_member_own on koshora.transactions
  for update to authenticated
  using (hub.current_user_has_app('koshora') and auth.uid() = user_id)
  with check (hub.current_user_has_app('koshora') and auth.uid() = user_id);
create policy transactions_delete_member_own on koshora.transactions
  for delete to authenticated
  using (hub.current_user_has_app('koshora') and auth.uid() = user_id);

create policy budgets_select_member_own on koshora.budgets
  for select to authenticated
  using (hub.current_user_has_app('koshora') and auth.uid() = user_id);
create policy budgets_insert_member_own on koshora.budgets
  for insert to authenticated
  with check (hub.current_user_has_app('koshora') and auth.uid() = user_id);
create policy budgets_update_member_own on koshora.budgets
  for update to authenticated
  using (hub.current_user_has_app('koshora') and auth.uid() = user_id)
  with check (hub.current_user_has_app('koshora') and auth.uid() = user_id);
create policy budgets_delete_member_own on koshora.budgets
  for delete to authenticated
  using (hub.current_user_has_app('koshora') and auth.uid() = user_id);

create policy recurring_select_member_own on koshora.recurring_transactions
  for select to authenticated
  using (hub.current_user_has_app('koshora') and auth.uid() = user_id);
create policy recurring_insert_member_own on koshora.recurring_transactions
  for insert to authenticated
  with check (hub.current_user_has_app('koshora') and auth.uid() = user_id);
create policy recurring_update_member_own on koshora.recurring_transactions
  for update to authenticated
  using (hub.current_user_has_app('koshora') and auth.uid() = user_id)
  with check (hub.current_user_has_app('koshora') and auth.uid() = user_id);
create policy recurring_delete_member_own on koshora.recurring_transactions
  for delete to authenticated
  using (hub.current_user_has_app('koshora') and auth.uid() = user_id);

create policy goals_select_member_own on koshora.savings_goals
  for select to authenticated
  using (hub.current_user_has_app('koshora') and auth.uid() = user_id);
create policy goals_insert_member_own on koshora.savings_goals
  for insert to authenticated
  with check (hub.current_user_has_app('koshora') and auth.uid() = user_id);
create policy goals_update_member_own on koshora.savings_goals
  for update to authenticated
  using (hub.current_user_has_app('koshora') and auth.uid() = user_id)
  with check (hub.current_user_has_app('koshora') and auth.uid() = user_id);
create policy goals_delete_member_own on koshora.savings_goals
  for delete to authenticated
  using (hub.current_user_has_app('koshora') and auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 6. Client grants — still constrained by RLS
-- ---------------------------------------------------------------------------

revoke all on all tables in schema koshora
  from public, anon, authenticated, service_role;
revoke all on all sequences in schema koshora
  from public, anon, authenticated, service_role;

grant select, insert, update, delete
  on koshora.profiles,
     koshora.categories,
     koshora.accounts,
     koshora.transactions,
     koshora.budgets,
     koshora.recurring_transactions,
     koshora.savings_goals
  to authenticated;

-- Future objects remain deny-by-default.
alter default privileges for role postgres in schema koshora
  revoke all on tables from public, anon, authenticated, service_role;
alter default privileges for role postgres in schema koshora
  revoke all on sequences from public, anon, authenticated, service_role;
alter default privileges for role postgres in schema koshora
  revoke execute on functions from public, anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 7. Register only Koshora-owned resources and migration metadata
-- ---------------------------------------------------------------------------

insert into hub.app_resources (
  app_id,
  resource_type,
  resource_name,
  resource_schema,
  is_shared,
  notes
)
select
  a.id,
  r.resource_type,
  r.resource_name,
  'koshora',
  false,
  r.notes
from hub.apps a
cross join (
  values
    ('table', 'koshora.profiles', 'Koshora profile/preferences data'),
    ('table', 'koshora.categories', 'Koshora income and expense categories'),
    ('table', 'koshora.accounts', 'Koshora internal financial accounts'),
    ('table', 'koshora.transactions', 'Koshora income, expense and transfer records'),
    ('table', 'koshora.budgets', 'Koshora monthly category budgets'),
    ('table', 'koshora.recurring_transactions', 'Koshora recurring financial commitments'),
    ('table', 'koshora.savings_goals', 'Koshora savings goals'),
    ('rpc', 'koshora.koshora_join_current_user', 'Scoped Koshora self-membership bootstrap')
) as r(resource_type, resource_name, notes)
where a.app_number = 2
  and a.slug = 'koshora'
on conflict (resource_type, resource_name) do nothing;

insert into hub.schema_versions (
  app_id,
  migration_key,
  notes
)
select
  a.id,
  'koshora__001_core_finance_backend',
  'Koshora App #2 core finance backend: 7 finance tables, ownership-aware constraints, membership-gated RLS, scoped self-membership RPC and client grants.'
from hub.apps a
where a.app_number = 2
  and a.slug = 'koshora'
on conflict (app_id, migration_key) do nothing;

update hub.apps
set
  status = 'active',
  updated_at = now()
where app_number = 2
  and slug = 'koshora'
  and schema_name = 'koshora'
  and status = 'planned';

insert into hub.audit_events (
  app_id,
  actor_kind,
  event_type,
  object_schema,
  object_name,
  details
)
select
  a.id,
  'admin',
  'koshora_core_backend_created',
  'koshora',
  'core_finance_backend',
  jsonb_build_object(
    'migration', 'koshora__001_core_finance_backend',
    'tables', 7,
    'rls', true,
    'membership_boundary', true,
    'cross_app_dependencies', false,
    'project_wide_settings_changed', false
  )
from hub.apps a
where a.app_number = 2
  and a.slug = 'koshora';

commit;
