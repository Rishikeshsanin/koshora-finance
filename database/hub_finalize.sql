-- KOSHORA PROJECT HUB FINALIZATION — HUB ADMIN ONLY
-- Run only after database/schema.sql has applied successfully and isolation checks pass.

select * from hub.read_me_first;

select slug, display_name, schema_name, status
from hub.apps
where slug = 'koshora';

select hub.assert_app_scope('koshora', 'koshora');

-- Confirm the Koshora-owned RPC exists before registering it.
do $$
begin
  if to_regprocedure('koshora.koshora_join_current_user()') is null then
    raise exception 'Koshora finalization stopped: membership RPC is missing';
  end if;
end;
$$;

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
  'rpc',
  'koshora.koshora_join_current_user',
  'koshora',
  false,
  'Narrow authenticated self-enrollment into Koshora membership only'
from hub.apps a
where a.slug = 'koshora'
and not exists (
  select 1 from hub.app_resources r
  where r.resource_type = 'rpc'
    and r.resource_name = 'koshora.koshora_join_current_user'
);

insert into hub.schema_versions (
  app_id,
  migration_key,
  notes
)
select
  a.id,
  'koshora_001_initial_finance_schema',
  'Initial Koshora schema, ownership-aware FKs, membership-gated RLS, and self-membership RPC'
from hub.apps a
where a.slug = 'koshora'
and not exists (
  select 1 from hub.schema_versions v
  where v.app_id = a.id
    and v.migration_key = 'koshora_001_initial_finance_schema'
);

update hub.apps
set status = 'active', updated_at = now()
where slug = 'koshora'
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
  'agent',
  'app_schema_activated',
  'koshora',
  'koshora',
  jsonb_build_object(
    'migration', 'koshora_001_initial_finance_schema',
    'rls', true,
    'membership_boundary', true
  )
from hub.apps a
where a.slug = 'koshora'
and not exists (
  select 1 from hub.audit_events e
  where e.app_id = a.id
    and e.event_type = 'app_schema_activated'
    and e.object_schema = 'koshora'
);
