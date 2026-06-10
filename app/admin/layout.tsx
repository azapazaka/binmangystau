import { redirect } from "next/navigation";
import { connection } from "next/server";

import { PanelShell } from "@/components/panel-shell";
import { getCurrentAdmin } from "@/lib/auth";
import { ADMIN_NAV_ITEMS, getLoginPathForRole } from "@/lib/role-config";

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await connection();
  const admin = await getCurrentAdmin();

  if (!admin) {
    redirect(getLoginPathForRole("admin"));
  }

  return (
    <PanelShell role="admin" userName={admin.fullName} items={ADMIN_NAV_ITEMS}>
      {children}
    </PanelShell>
  );
}
