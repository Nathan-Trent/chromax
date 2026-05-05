import { SessionExpiryWatcher } from "@/components/SessionExpiryWatcher";
import { AdminShell } from "@/components/admin/AdminShell";
import { GlobalAlertDialog } from "@/components/ui/GlobalAlertDialog";
import { parseUserRoleRows } from "@/lib/auth/parse-user-roles";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";

export default async function AdminGroupLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  const supabase = await createClient();

  const { data: claimsData, error: claimsError } = await supabase.auth.getClaims();
  if (claimsError || !claimsData?.claims?.sub) {
    redirect("/login");
  }

  const userId = String(claimsData.claims.sub);
  let email: string | undefined =
    typeof claimsData.claims.email === "string" ? claimsData.claims.email : undefined;

  if (!email) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    email = user?.email ?? undefined;
  }

  if (!email) {
    redirect("/login");
  }

  const { data: userRoleRows } = await supabase
    .from("user_roles")
    .select(
      `
      roles (
        id,
        name,
        description,
        permissions,
        is_system
      )
    `,
    )
    .eq("user_id", userId);

  const roles = parseUserRoleRows(userRoleRows ?? []);

  return (
    <>
      <SessionExpiryWatcher />
      <GlobalAlertDialog />
      <AdminShell user={{ id: userId, email }} roles={roles}>
        {children}
      </AdminShell>
    </>
  );
}
