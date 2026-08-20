-- KOSHORA — APP #2 REGISTRATION / EMPTY SCHEMA
-- Architecture: Project Hub v2
--
-- PRECONDITIONS:
-- - AGENTS.md exists in Rishikeshsanin/koshora-finance
-- - SUPABASE_HUB_RULES.md exists in Rishikeshsanin/koshora-finance
-- - hub.read_me_first has been read and architecture_version >= 2
-- - Auralis remains App #1 and is not modified by this migration
-- - Hub foundation and safety-contract enforcement migrations are applied
--
-- This migration creates NO Koshora finance/application tables.
-- It touches hub.* only for the narrowly-scoped Koshora registration/resource/version/audit records.

begin;

-- Mandatory Hub notice must exist at Architecture v2 before registration.
do $$
declare
  v_architecture_version integer;
begin
  select architecture_version
    into v_architecture_version
  from hub.read_me_first
  where id = 1;

  if v_architecture_version is null or v_architecture_version < 2 then
    raise exception 'Koshora registration stopped: Project Hub architecture v2 is required';
  end if;
end;
$$;

-- Refuse any conflicting ownership. Exact prior Koshora registration is allowed for safe re-entry.
do $$
begin
  if exists (
    select 1
    from hub.protected_schemas
    where schema_name = 'koshora'
  ) then
    raise exception 'Koshora registration stopped: schema koshora is protected';
  end if;

  if exists (
    select 1
    from hub.apps
    where app_number = 2
      and not (
        slug = 'koshora'
        and schema_name = 'koshora'
        and repository_url = 'https://github.com/Rishikeshsanin/koshora-finance'
      )
  ) then
    raise exception 'Koshora registration stopped: Project Hub App #2 is already assigned';
  end if;

  if exists (
    select 1
    from hub.apps
    where (slug = 'koshora' or schema_name = 'koshora')
      and not (
        app_number = 2
        and slug = 'koshora'
        and schema_name = 'koshora'
        and repository_url = 'https://github.com/Rishikeshsanin/koshora-finance'
      )
  ) then
    raise exception 'Koshora registration stopped: slug/schema koshora is already owned inconsistently';
  end if;
end;
$$;

insert into hub.apps (
  app_number,
  slug,
  display_name,
  schema_name,
  status,
  data_classification,
  repository_url,
  agent_instructions_path,
  hub_rules_path,
  safety_contract_version,
  safety_contract_acknowledged_at,
  safety_contract_verified_by,
  notes
) values (
  2,
  'koshora',
  'Koshora',
  'koshora',
  'planned',
  'portfolio',
  'https://github.com/Rishikeshsanin/koshora-finance',
  'AGENTS.md',
  'SUPABASE_HUB_RULES.md',
  2,
  now(),
  'ChatGPT + GitHub verification',
  'Project Hub App #2. Personal-finance portfolio application. Application data must remain isolated to koshora.* and Koshora-prefixed registered resources.'
)
on conflict (slug) do nothing;

-- Verify the exact registration contract before any schema object is created.
do $$
begin
  if not exists (
    select 1
    from hub.apps
    where app_number = 2
      and slug = 'koshora'
      and display_name = 'Koshora'
      and schema_name = 'koshora'
      and status in ('planned','active','paused')
      and repository_url = 'https://github.com/Rishikeshsanin/koshora-finance'
      and agent_instructions_path = 'AGENTS.md'
      and hub_rules_path = 'SUPABASE_HUB_RULES.md'
      and safety_contract_version = 2
      and safety_contract_acknowledged_at is not null
  ) then
    raise exception 'Koshora registration stopped: hub.apps safety contract does not match App #2';
  end if;
end;
$$;

select hub.assert_app_scope('koshora', 'koshora');

create schema if not exists koshora authorization postgres;

comment on schema koshora is
'KOSHORA APP #2 ONLY. Before any write read hub.read_me_first and repository AGENTS.md + SUPABASE_HUB_RULES.md. Never use this schema for another application.';

-- Empty schema starts deny-by-default. No client role receives access here yet.
revoke all on schema koshora from public, anon, authenticated, service_role;

alter default privileges for role postgres in schema koshora
  revoke all on tables from public, anon, authenticated, service_role;

alter default privileges for role postgres in schema koshora
  revoke all on sequences from public, anon, authenticated, service_role;

alter default privileges for role postgres in schema koshora
  revoke execute on functions from public, anon, authenticated, service_role;

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
  'schema',
  'koshora',
  'koshora',
  false,
  'Primary isolated application schema for Koshora App #2'
from hub.apps a
where a.slug = 'koshora'
on conflict (resource_type, resource_name) do nothing;

insert into hub.schema_versions (
  app_id,
  migration_key,
  notes
)
select
  a.id,
  'koshora__000_register_app',
  'Registered Koshora as Project Hub App #2 and created the empty isolated koshora schema. No finance tables yet.'
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
  'application_registered',
  'koshora',
  'schema',
  jsonb_build_object(
    'app_number', 2,
    'repository', 'Rishikeshsanin/koshora-finance',
    'safety_contract_version', 2,
    'application_tables_created', false,
    'cross_app_dependencies', false
  )
from hub.apps a
where a.slug = 'koshora'
  and not exists (
    select 1
    from hub.audit_events e
    where e.app_id = a.id
      and e.event_type = 'application_registered'
      and e.object_schema = 'koshora'
  );

commit;
