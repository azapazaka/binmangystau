import { redirect } from "next/navigation";
import { connection } from "next/server";

import { PanelShell } from "@/components/panel-shell";
import { getCurrentCitizen } from "@/lib/auth";
import { CITIZEN_NAV_ITEMS, getLoginPathForRole } from "@/lib/role-config";

export default async function CitizenLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  await connection();
  const citizen = await getCurrentCitizen();

  if (!citizen) {
    redirect(getLoginPathForRole("citizen"));
  }

  return (
    <PanelShell role="citizen" userName={citizen.fullName} items={CITIZEN_NAV_ITEMS}>
      {children}
    </PanelShell>
  );
}
