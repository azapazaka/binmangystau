import Link from "next/link";

import { AdminProfileEditor } from "@/components/admin-profile-editor";
import { getCurrentAdmin } from "@/lib/auth";
import { isSupabaseConfigured } from "@/lib/env";
import { getDefaultAdminProfile } from "@/lib/profile-defaults";
import { getCurrentUserProfile } from "@/lib/profile-store";

export default async function AdminProfilePage() {
  const admin = await getCurrentAdmin();
  const defaultProfile = getDefaultAdminProfile(admin?.fullName);
  const storedProfile =
    admin && isSupabaseConfigured()
      ? await getCurrentUserProfile(admin)
      : defaultProfile;
  const initialProfile = {
    displayName: storedProfile.hasStoredProfile ? storedProfile.displayName : defaultProfile.displayName,
    position:
      storedProfile.hasStoredProfile && storedProfile.role === "admin"
        ? storedProfile.position
        : defaultProfile.position,
    department:
      storedProfile.hasStoredProfile && storedProfile.role === "admin"
        ? storedProfile.department
        : defaultProfile.department,
    district: storedProfile.hasStoredProfile ? storedProfile.district : defaultProfile.district,
    bio: storedProfile.hasStoredProfile ? storedProfile.bio : defaultProfile.bio,
    categories:
      storedProfile.hasStoredProfile && storedProfile.role === "admin"
        ? storedProfile.categories
        : defaultProfile.categories,
    avatarUrl: storedProfile.hasStoredProfile ? storedProfile.avatarUrl : defaultProfile.avatarUrl,
  };

  return (
    <div className="grid gap-6">
      <AdminProfileEditor
        email={admin?.email ?? "admin@citypulse.local"}
        initialProfile={initialProfile}
        resetProfile={{
          displayName: defaultProfile.displayName,
          position: defaultProfile.position,
          department: defaultProfile.department,
          district: defaultProfile.district,
          bio: defaultProfile.bio,
          categories: defaultProfile.categories,
          avatarUrl: defaultProfile.avatarUrl,
        }}
        storageKey={`citypulse-admin-profile:${admin?.email ?? "guest"}`}
        hasStoredProfile={storedProfile.hasStoredProfile}
        isDemo={Boolean(admin?.isDemo)}
      />

      <section className="panel-surface rounded-[2.4rem] p-6 md:p-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="panel-kicker text-xs uppercase tracking-[0.34em]">Workspace</p>
            <h2 className="panel-title mt-3 text-4xl font-semibold">Рабочие разделы админки</h2>
            <p className="panel-copy mt-4 max-w-3xl text-base leading-8">
              Ниже собраны разделы, с которыми уже реально работает администратор: очередь жалоб,
              карта и аналитика. Профиль дополняет эти экраны, а не подменяет их выдуманными
              рабочими метриками.
            </p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            {
              href: "/admin/reports",
              title: "Жалобы",
              description: "Основная рабочая очередь с карточками кластеров и управлением статусами.",
            },
            {
              href: "/admin/map",
              title: "Карта",
              description: "География обращений и визуальный контроль зон, где накопились проблемы.",
            },
            {
              href: "/admin/analytics",
              title: "Аналитика",
              description:
                "Обзор категорий, районов и общей динамики без привязки к выдуманной личной эффективности.",
            },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="panel-interactive-card rounded-[1.8rem] p-5"
            >
              <p className="panel-section-title text-lg font-semibold">{item.title}</p>
              <p className="panel-copy mt-3 text-sm leading-7">{item.description}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
