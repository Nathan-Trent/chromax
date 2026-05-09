-- Add erp_sync.edit for mutation routes (approve/reject/link/settings/etc.).
-- Super Admin: edit true; other system roles: edit false (view-only ERP access unchanged).

update public.roles
set permissions = jsonb_set(
  coalesce(permissions, '{}'::jsonb),
  '{erp_sync,edit}',
  case
    when name = 'Super Admin' and is_system is true then 'true'::jsonb
    else 'false'::jsonb
  end,
  true
)
where is_system is true
  and permissions ? 'erp_sync';
