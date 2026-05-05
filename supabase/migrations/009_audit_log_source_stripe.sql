-- Allow Stripe (and Paystack) webhooks to record audit entries with explicit source values.
alter table public.audit_log drop constraint if exists audit_log_source_check;

alter table public.audit_log add constraint audit_log_source_check
  check (source in ('dashboard', 'erp', 'ai', 'system', 'stripe', 'paystack'));
