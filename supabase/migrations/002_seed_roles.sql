-- Default Chromax admin roles (permissions jsonb matches roles.permissions comment in chromax-data-models.md).

insert into public.roles (name, description, permissions, is_system)
values
(
  'Super Admin',
  'Full platform access',
  '{
    "products":     {"view": true, "create": true, "edit": true, "delete": true, "approve_pricing": true},
    "orders":       {"view": true, "fulfil": true, "cancel_request": true, "cancel_approve": true},
    "b2b":          {"view": true, "respond": true, "approve": true},
    "content":      {"view": true, "create": true, "edit": true, "delete": true},
    "swatches":     {"view": true, "edit": true},
    "certifications": {"view": true, "edit": true},
    "projects":     {"view": true, "edit": true},
    "blog":         {"view": true, "create": true, "edit": true, "delete": true},
    "users":        {"view": true, "create": true, "edit": true, "delete": true},
    "workflows":    {"view": true, "edit": true},
    "audit_log":    {"view": true},
    "erp_sync":     {"view": true, "edit": true},
    "ai_leads":     {"view": true, "create": true, "edit": true, "delete": true}
  }'::jsonb,
  true
),
(
  'Content Editor',
  'CMS content, projects and blog — no catalog pricing, orders or B2B',
  '{
    "products":     {"view": false, "create": false, "edit": false, "delete": false, "approve_pricing": false},
    "orders":       {"view": false, "fulfil": false, "cancel_request": false, "cancel_approve": false},
    "b2b":          {"view": false, "respond": false, "approve": false},
    "content":      {"view": true, "create": true, "edit": true, "delete": true},
    "swatches":     {"view": true, "edit": true},
    "certifications": {"view": true, "edit": true},
    "projects":     {"view": true, "edit": true},
    "blog":         {"view": true, "create": true, "edit": true, "delete": true},
    "users":        {"view": false, "create": false, "edit": false, "delete": false},
    "workflows":    {"view": false, "edit": false},
    "audit_log":    {"view": false},
    "erp_sync":     {"view": false, "edit": false},
    "ai_leads":     {"view": false, "create": false, "edit": false, "delete": false}
  }'::jsonb,
  true
),
(
  'Fulfilment Manager',
  'Order fulfilment and ERP sync visibility',
  '{
    "products":     {"view": false, "create": false, "edit": false, "delete": false, "approve_pricing": false},
    "orders":       {"view": true, "fulfil": true, "cancel_request": false, "cancel_approve": false},
    "b2b":          {"view": false, "respond": false, "approve": false},
    "content":      {"view": false, "create": false, "edit": false, "delete": false},
    "swatches":     {"view": false, "edit": false},
    "certifications": {"view": false, "edit": false},
    "projects":     {"view": false, "edit": false},
    "blog":         {"view": false, "create": false, "edit": false, "delete": false},
    "users":        {"view": false, "create": false, "edit": false, "delete": false},
    "workflows":    {"view": false, "edit": false},
    "audit_log":    {"view": false},
    "erp_sync":     {"view": true, "edit": false},
    "ai_leads":     {"view": false, "create": false, "edit": false, "delete": false}
  }'::jsonb,
  true
),
(
  'Chief Accountant',
  'Pricing approvals, cancellations, B2B approval and audit visibility',
  '{
    "products":     {"view": false, "create": false, "edit": false, "delete": false, "approve_pricing": true},
    "orders":       {"view": true, "fulfil": false, "cancel_request": false, "cancel_approve": true},
    "b2b":          {"view": true, "respond": false, "approve": true},
    "content":      {"view": false, "create": false, "edit": false, "delete": false},
    "swatches":     {"view": false, "edit": false},
    "certifications": {"view": false, "edit": false},
    "projects":     {"view": false, "edit": false},
    "blog":         {"view": false, "create": false, "edit": false, "delete": false},
    "users":        {"view": false, "create": false, "edit": false, "delete": false},
    "workflows":    {"view": false, "edit": false},
    "audit_log":    {"view": true},
    "erp_sync":     {"view": false, "edit": false},
    "ai_leads":     {"view": false, "create": false, "edit": false, "delete": false}
  }'::jsonb,
  true
),
(
  'Sales Manager',
  'B2B pipeline, order visibility and AI leads',
  '{
    "products":     {"view": false, "create": false, "edit": false, "delete": false, "approve_pricing": false},
    "orders":       {"view": true, "fulfil": false, "cancel_request": false, "cancel_approve": false},
    "b2b":          {"view": true, "respond": true, "approve": false},
    "content":      {"view": false, "create": false, "edit": false, "delete": false},
    "swatches":     {"view": false, "edit": false},
    "certifications": {"view": false, "edit": false},
    "projects":     {"view": false, "edit": false},
    "blog":         {"view": false, "create": false, "edit": false, "delete": false},
    "users":        {"view": false, "create": false, "edit": false, "delete": false},
    "workflows":    {"view": false, "edit": false},
    "audit_log":    {"view": false},
    "erp_sync":     {"view": false, "edit": false},
    "ai_leads":     {"view": true, "create": false, "edit": false, "delete": false}
  }'::jsonb,
  true
)
on conflict (name) do nothing;
