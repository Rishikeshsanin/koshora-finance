-- KOSHORA PROJECT HUB ONBOARDING — HUB ADMIN ONLY
-- This migration touches only Koshora registry/resource rows plus the new koshora schema.
-- It must not be run until hub.read_me_first has been reviewed live.

select * from hub.read_me_first;

-- Refuse protected/conflicting ownership instead of updating another app.
do $$
begin
  if exists (
    select 1 from hub.protected_schemas where schema_name = 'koshora'
  ) then
    raise exception 'Koshora onboarding stopped: schema koshora is protected';
  end if;

  if exists (
    select 1 from hub.apps
    where (slug = 'koshora' or schema_name = 'koshora')
      and not (slug = 'koshora' and schema_name = 'koshora')
  ) then
    raise exception 'Koshora onboarding stopped: conflicting Hub registry ownership';
  end if;
end;
$$;

insert into hub.apps (
  slug,
  display_name,
  schema_name,
  status,
  data_classification,
  repository_url,
  dedicated_project_recommended,
  notes
)
select
  'koshora',
  'Koshora',
  'koshora',
  'planned',
  'portfolio',
  'https://github.com/Rishikeshsanin/koshora-finance',
  false,
  'Personal-finance portfolio app. Shared Hub deployment; isolation required.'
where not exists (
  select 1 from hub.apps where slug = 'koshora'
);

select slug, display_name, schema_name, status
from hub.apps
where slug = 'koshora';

create schema if not exists koshora authorization postgres;

select hub.assert_app_scope('koshora', 'koshora');

revoke all on schema koshora from public, anon, authenticated, service_role;
grant usage on schema koshora to authenticated;

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
  'Primary Koshora application schema'
from hub.apps a
where a.slug = 'koshora'
and not exists (
  select 1 from hub.app_resources r
  where r.resource_type = 'schema' and r.resource_name = 'koshora'
);

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
  'app_onboarded',
  'koshora',
  'koshora',
  jsonb_build_object(
    'repository', 'https://github.com/Rishikeshsanin/koshora-finance',
    'boundary', 'isolated_app_schema'
  )
from hub.apps a
where a.slug = 'koshora'
and not exists (
  select 1 from hub.audit_events e
  where e.app_id = a.id
    and e.event_type = 'app_onboarded'
    and e.object_schema = 'koshora'
);
