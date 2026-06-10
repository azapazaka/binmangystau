import { redirect } from "next/navigation";

export default async function AdminAnalyticsPage() {
  redirect("/admin?tab=analytics");
}
