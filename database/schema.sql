-- Koshora production schema for Supabase Postgres.
-- All public tables use Row Level Security and ownership-aware relationships.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  currency text not null default 'INR' check (char_length(currency) = 3),
  onboarding_complete boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
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

create table if not exists public.accounts (
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

create table if not exists public.transactions (
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
  constraint transactions_category_owner_fk foreign key (category_id, user_id) references public.categories(id, user_id) on delete set null (category_id),
  constraint transactions_account_owner_fk foreign key (account_id, user_id) references public.accounts(id, user_id) on delete restrict,
  constraint transactions_to_account_owner_fk foreign key (to_account_id, user_id) references public.accounts(id, user_id) on delete restrict,
  constraint transfer_shape check (
    (type = 'transfer' and category_id is null and to_account_id is not null and to_account_id <> account_id)
    or (type <> 'transfer' and to_account_id is null)
  )
);

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  category_id uuid not null,
  month_start date not null check (month_start = date_trunc('month', month_start)::date),
  amount_limit numeric(14,2) not null check (amount_limit > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint budgets_category_owner_fk foreign key (category_id, user_id) references public.categories(id, user_id) on delete cascade,
  unique (user_id, category_id, month_start)
);

create table if not exists public.recurring_transactions (
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
  constraint recurring_category_owner_fk foreign key (category_id, user_id) references public.categories(id, user_id) on delete set null (category_id),
  constraint recurring_account_owner_fk foreign key (account_id, user_id) references public.accounts(id, user_id) on delete restrict
);

create table if not exists public.savings_goals (
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

create index if not exists transactions_user_date_idx on public.transactions(user_id, occurred_on desc);
create index if not exists transactions_user_category_idx on public.transactions(user_id, category_id, occurred_on desc);
create index if not exists transactions_user_account_idx on public.transactions(user_id, account_id, occurred_on desc);
create index if not exists budgets_user_month_idx on public.budgets(user_id, month_start desc);
create index if not exists recurring_user_next_idx on public.recurring_transactions(user_id, active, next_date);

create or replace function public.set_updated_at()
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

create or replace trigger profiles_set_updated_at before update on public.profiles for each row execute function public.set_updated_at();
create or replace trigger accounts_set_updated_at before update on public.accounts for each row execute function public.set_updated_at();
create or replace trigger transactions_set_updated_at before update on public.transactions for each row execute function public.set_updated_at();
create or replace trigger budgets_set_updated_at before update on public.budgets for each row execute function public.set_updated_at();
create or replace trigger recurring_set_updated_at before update on public.recurring_transactions for each row execute function public.set_updated_at();
create or replace trigger goals_set_updated_at before update on public.savings_goals for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.accounts enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;
alter table public.recurring_transactions enable row level security;
alter table public.savings_goals enable row level security;

-- Explicit Data API grants; RLS remains the row-level authorization boundary.
grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.categories to authenticated;
grant select, insert, update, delete on public.accounts to authenticated;
grant select, insert, update, delete on public.transactions to authenticated;
grant select, insert, update, delete on public.budgets to authenticated;
grant select, insert, update, delete on public.recurring_transactions to authenticated;
grant select, insert, update, delete on public.savings_goals to authenticated;

-- Profiles use id itself as the owner identifier.
create policy "profiles_select_own" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);
create policy "profiles_delete_own" on public.profiles for delete to authenticated using ((select auth.uid()) = id);

-- Every finance row is private to its owner. UPDATE includes both USING and WITH CHECK.
create policy "categories_select_own" on public.categories for select to authenticated using ((select auth.uid()) = user_id);
create policy "categories_insert_own" on public.categories for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "categories_update_own" on public.categories for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "categories_delete_own" on public.categories for delete to authenticated using ((select auth.uid()) = user_id);

create policy "accounts_select_own" on public.accounts for select to authenticated using ((select auth.uid()) = user_id);
create policy "accounts_insert_own" on public.accounts for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "accounts_update_own" on public.accounts for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "accounts_delete_own" on public.accounts for delete to authenticated using ((select auth.uid()) = user_id);

create policy "transactions_select_own" on public.transactions for select to authenticated using ((select auth.uid()) = user_id);
create policy "transactions_insert_own" on public.transactions for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "transactions_update_own" on public.transactions for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "transactions_delete_own" on public.transactions for delete to authenticated using ((select auth.uid()) = user_id);

create policy "budgets_select_own" on public.budgets for select to authenticated using ((select auth.uid()) = user_id);
create policy "budgets_insert_own" on public.budgets for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "budgets_update_own" on public.budgets for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "budgets_delete_own" on public.budgets for delete to authenticated using ((select auth.uid()) = user_id);

create policy "recurring_select_own" on public.recurring_transactions for select to authenticated using ((select auth.uid()) = user_id);
create policy "recurring_insert_own" on public.recurring_transactions for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "recurring_update_own" on public.recurring_transactions for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "recurring_delete_own" on public.recurring_transactions for delete to authenticated using ((select auth.uid()) = user_id);

create policy "goals_select_own" on public.savings_goals for select to authenticated using ((select auth.uid()) = user_id);
create policy "goals_insert_own" on public.savings_goals for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "goals_update_own" on public.savings_goals for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "goals_delete_own" on public.savings_goals for delete to authenticated using ((select auth.uid()) = user_id);
