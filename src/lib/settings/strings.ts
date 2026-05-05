import { createServiceRoleClient } from "@/lib/supabase/service";

export async function getSettingString(key: string): Promise<string> {
  try {
    const service = createServiceRoleClient();
    const { data, error } = await service.from("settings").select("value").eq("key", key).maybeSingle();
    if (error || data?.value === undefined || data?.value === null) return "";
    if (typeof data.value === "string") return data.value.trim();
    return String(data.value).trim();
  } catch {
    return "";
  }
}
