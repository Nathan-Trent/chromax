import { createClient } from "@/lib/supabase/server";
import { createServiceRoleClient } from "@/lib/supabase/service";

async function adminClient() {
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return createServiceRoleClient();
  }
  return await createClient();
}

/** All settings rows as key → parsed jsonb value. */
export async function getSettings(): Promise<Record<string, unknown>> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("settings").select("key, value");

  if (error) {
    throw new Error(`getSettings failed: ${error.message}`);
  }

  const out: Record<string, unknown> = {};
  for (const row of data ?? []) {
    if (row.key) {
      out[row.key] = row.value as unknown;
    }
  }
  return out;
}

export async function getSetting(key: string): Promise<unknown | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("settings")
    .select("value")
    .eq("key", key)
    .maybeSingle();

  if (error) {
    throw new Error(`getSetting failed for "${key}": ${error.message}`);
  }

  if (!data) return null;
  return data.value as unknown;
}

/** Upsert a settings row. Prefer service role in production admin routes. */
export async function updateSetting(key: string, value: unknown): Promise<void> {
  const supabase = await adminClient();
  const { error } = await supabase.from("settings").upsert(
    { key, value },
    { onConflict: "key" },
  );

  if (error) {
    throw new Error(`updateSetting failed for "${key}": ${error.message}`);
  }
}
