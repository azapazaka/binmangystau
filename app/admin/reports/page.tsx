import { redirect } from "next/navigation";

export default async function AdminReportsPage() {
  redirect("/admin?tab=reports");
}
