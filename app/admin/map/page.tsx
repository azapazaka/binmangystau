import { redirect } from "next/navigation";

export default async function AdminMapPage() {
  redirect("/admin?tab=map");
}
