-- KOSHORA APP #2 — RLS INITPLAN PERFORMANCE OPTIMIZATION
-- Migration key: koshora__002_optimize_rls_initplans
-- Project Hub architecture v2
--
-- Scope: Koshora policies only.
-- Purpose: avoid per-row re-evaluation of auth.uid() and Hub membership checks.
-- Does NOT modify Auralis, public.*, auth settings, Storage, Realtime, or other apps.

begin;

select * from hub.read_me_first;
select hub.assert_app_scope('koshora', 'koshora');

do $$
begin
  if not exists (
    select 1
    from hub.apps
    where app_number = 2
      and slug = 'koshora'
      and schema_name = 'koshora'
      and status = 'active'
      and safety_contract_version = 2
      and safety_contract_acknowledged_at is not null
  ) then
    raise exception 'Koshora RLS optimization stopped: active App #2 registration not found';
  end if;
end;
$$;

-- Profiles
alter policy profiles_select_member_own on koshora.profiles
  using ((select hub.current_user_has_app('koshora')) and (select auth.uid()) = id);
alter policy profiles_insert_member_own on koshora.profiles
  with check ((select hub.current_user_has_app('koshora')) and (select auth.uid()) = id);
alter policy profiles_update_member_own on koshora.profiles
  using ((select hub.current_user_has_app('koshora')) and (select auth.uid()) = id)
  with check ((select hub.current_user_has_app('koshora')) and (select auth.uid()) = id);
alter policy profiles_delete_member_own on koshora.profiles
  using ((select hub.current_user_has_app('koshora')) and (select auth.uid()) = id);

-- Categories
alter policy categories_select_member_own on koshora.categories
  using ((select hub.current_user_has_app('koshora')) and (select auth.uid()) = user_id);
alter policy categories_insert_member_own on koshora.categories
  with check ((select hub.current_user_has_app('koshora')) and (select auth.uid()) = user_id);
alter policy categories_update_member_own on koshora.categories
  using ((select hub.current_user_has_app('koshora')) and (select auth.uid()) = user_id)
  with check ((select hub.current_user_has_app('koshora')) and (select auth.uid()) = user_id);
alter policy categories_delete_member_own on koshora.categories
  using ((select hub.current_user_has_app('koshora')) and (select auth.uid()) = user_id);

-- Accounts
alter policy accounts_select_member_own on koshora.accounts
  using ((select hub.current_user_has_app('koshora')) and (select auth.uid()) = user_id);
alter policy accounts_insert_member_own on koshora.accounts
  with check ((select hub.current_user_has_app('koshora')) and (select auth.uid()) = user_id);
alter policy accounts_update_member_own on koshora.accounts
  using ((select hub.current_user_has_app('koshora')) and (select auth.uid()) = user_id)
  with check ((select hub.current_user_has_app('koshora')) and (select auth.uid()) = user_id);
alter policy accounts_delete_member_own on koshora.accounts
  using ((select hub.current_user_has_app('koshora')) and (select auth.uid()) = user_id);

-- Transactions
alter policy transactions_select_member_own on koshora.transactions
  using ((select hub.current_user_has_app('koshora')) and (select auth.uid()) = user_id);
alter policy transactions_insert_member_own on koshora.transactions
  with check ((select hub.current_user_has_app('koshora')) and (select auth.uid()) = user_id);
alter policy transactions_update_member_own on koshora.transactions
  using ((select hub.current_user_has_app('koshora')) and (select auth.uid()) = user_id)
  with check ((select hub.current_user_has_app('koshora')) and (select auth.uid()) = user_id);
alter policy transactions_delete_member_own on koshora.transactions
  using ((select hub.current_user_has_app('koshora')) and (select auth.uid()) = user_id);

-- Budgets
alter policy budgets_select_member_own on koshora.budgets
  using ((select hub.current_user_has_app('koshora')) and (select auth.uid()) = user_id);
alter policy budgets_insert_member_own on koshora.budgets
  with check ((select hub.current_user_has_app('koshora')) and (select auth.uid()) = user_id);
alter policy budgets_update_member_own on koshora.budgets
  using ((select hub.current_user_has_app('koshora')) and (select auth.uid()) = user_id)
  with check ((select hub.current_user_has_app('koshora')) and (select auth.uid()) = user_id);
alter policy budgets_delete_member_own on koshora.budgets
  using ((select hub.current_user_has_app('koshora')) and (select auth.uid()) = user_id);

-- Recurring transactions
alter policy recurring_select_member_own on koshora.recurring_transactions
  using ((select hub.current_user_has_app('koshora')) and (select auth.uid()) = user_id);
alter policy recurring_insert_member_own on koshora.recurring_transactions
  with check ((select hub.current_user_has_app('koshora')) and (select auth.uid()) = user_id);
alter policy recurring_update_member_own on koshora.recurring_transactions
  using ((select hub.current_user_has_app('koshora')) and (select auth.uid()) = user_id)
  with check ((select hub.current_user_has_app('koshora')) and (select auth.uid()) = user_id);
alter policy recurring_delete_member_own on koshora.recurring_transactions
  using ((select hub.current_user_has_app('koshora')) and (select auth.uid()) = user_id);

-- Savings goals
alter policy goals_select_member_own on koshora.savings_goals
  using ((select hub.current_user_has_app('koshora')) and (select auth.uid()) = user_id);
alter policy goals_insert_member_own on koshora.savings_goals
  with check ((select hub.current_user_has_app('koshora')) and (select auth.uid()) = user_id);
alter policy goals_update_member_own on koshora.savings_goals
  using ((select hub.current_user_has_app('koshora')) and (select auth.uid()) = user_id)
  with check ((select hub.current_user_has_app('koshora')) and (select auth.uid()) = user_id);
alter policy goals_delete_member_own on koshora.savings_goals
  using ((select hub.current_user_has_app('koshora')) and (select auth.uid()) = user_id);

insert into hub.schema_versions (
  app_id,
  migration_key,
  notes
)
select
  a.id,
  'koshora__002_optimize_rls_initplans',
  'Optimized all Koshora RLS policies to evaluate auth and app-membership checks through scalar InitPlans rather than once per row.'
from hub.apps a
where a.slug = 'koshora'
on conflict (app_id, migration_key) do nothing;

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
  'rls_performance_optimized',
  'koshora',
  'policies',
  jsonb_build_object(
    'migration_key', 'koshora__002_optimize_rls_initplans',
    'policies_optimized', 28,
    'security_semantics_changed', false,
    'cross_app_changes', false
  )
from hub.apps a
where a.slug = 'koshora'
  and not exists (
    select 1
    from hub.audit_events e
    where e.app_id = a.id
      and e.event_type = 'rls_performance_optimized'
      and e.object_schema = 'koshora'
  );

commit;
