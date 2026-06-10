import { CitizenProfileEditor } from "@/components/citizen-profile-editor";
import { getCurrentCitizen } from "@/lib/auth";
import {
  getCitizenReports,
  getCitizenSummary,
  getRecentCitizenReportsCount,
} from "@/lib/citizen-data";
import { CATEGORY_META } from "@/lib/constants";
import { listReports } from "@/lib/data-store";
import { getDefaultCitizenProfile } from "@/lib/profile-defaults";
import { getCurrentUserProfile } from "@/lib/profile-store";

function getCitizenLevel(activityScore: number) {
  if (activityScore >= 70) {
    return {
      title: "Городской лидер",
      note: "Вы не просто оставляете обращения, а стабильно двигаете решения вперёд.",
    };
  }

  if (activityScore >= 35) {
    return {
      title: "Сильный участник",
      note: "У вас уже заметная активность и хороший вклад в городскую повестку.",
    };
  }

  if (activityScore >= 10) {
    return {
      title: "Активный житель",
      note: "Вы уже начали формировать свою репутацию в CityPulse.",
    };
  }

  return {
    title: "Новый участник",
    note: "Профиль только набирает историю. Пара обращений уже даст первые баллы.",
  };
}

export default async function CitizenProfilePage() {
  const citizen = await getCurrentCitizen();
  const defaultProfile = getDefaultCitizenProfile(citizen?.fullName);
  const storedProfile = citizen ? await getCurrentUserProfile(citizen) : defaultProfile;
  const initialProfile = {
    displayName: storedProfile.hasStoredProfile ? storedProfile.displayName : defaultProfile.displayName,
    district: storedProfile.hasStoredProfile ? storedProfile.district : defaultProfile.district,
    bio: storedProfile.hasStoredProfile ? storedProfile.bio : defaultProfile.bio,
    avatarUrl: storedProfile.hasStoredProfile ? storedProfile.avatarUrl : defaultProfile.avatarUrl,
  };
  const citizenId = citizen?.email ?? "";
  const allReports = await listReports();
  const summary = getCitizenSummary(allReports, citizenId);
  const myReports = getCitizenReports(allReports, citizenId);
  const weeklyReports = getRecentCitizenReportsCount(allReports, citizenId, 7);
  const inProgressReports = myReports.filter((report) => report.status === "in_progress").length;
  const topCategoryEntry = Object.entries(
    myReports.reduce<Record<string, number>>((accumulator, report) => {
      accumulator[report.userCategory] = (accumulator[report.userCategory] ?? 0) + 1;
      return accumulator;
    }, {}),
  ).sort((left, right) => right[1] - left[1])[0];
  const topCategory =
    topCategoryEntry && topCategoryEntry[0] in CATEGORY_META
      ? CATEGORY_META[topCategoryEntry[0] as keyof typeof CATEGORY_META].label
      : "Пока не определена";
  const latestAddress =
    myReports[0]?.address ?? "Добавьте первое обращение, чтобы увидеть историю активности";
  const level = getCitizenLevel(summary.activityScore);

  return (
    <div className="grid gap-6">
      <CitizenProfileEditor
        email={citizen?.email ?? "citizen@citypulse.local"}
        initialProfile={initialProfile}
        resetProfile={{
          displayName: defaultProfile.displayName,
          district: defaultProfile.district,
          bio: defaultProfile.bio,
          avatarUrl: defaultProfile.avatarUrl,
        }}
        storageKey={`citypulse-citizen-profile:${citizen?.email ?? "guest"}`}
        hasStoredProfile={storedProfile.hasStoredProfile}
        isDemo={Boolean(citizen?.isDemo)}
      />

      <section className="panel-surface rounded-[2.4rem] p-6 md:p-8">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(340px,0.8fr)]">
          <div>
            <p className="panel-kicker text-xs uppercase tracking-[0.34em]">Citizen stats</p>
            <h2 className="panel-title mt-3 text-4xl font-semibold">Рейтинг и активность</h2>
            <p className="panel-copy mt-4 max-w-3xl text-base leading-8">
              Здесь собрана вторая часть профиля: баллы, место в рейтинге, текущая активность и
              личная динамика по обращениям. То есть сначала персональные данные, ниже уже ваш
              реальный вклад в городской сервис.
            </p>

            <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                { label: "Место в рейтинге", value: summary.currentRank ?? "—" },
                { label: "Баллы активности", value: summary.activityScore },
                { label: "Решено", value: summary.resolvedReports },
                { label: "В работе", value: inProgressReports },
              ].map((item) => (
                <article key={item.label} className="panel-muted-card rounded-[1.5rem] p-5">
                  <p className="panel-kicker text-xs uppercase tracking-[0.28em]">{item.label}</p>
                  <p className="panel-title mt-3 text-4xl font-semibold">{item.value}</p>
                </article>
              ))}
            </div>
          </div>

          <aside className="panel-surface-strong rounded-[2rem] p-6">
            <p className="panel-kicker text-xs uppercase tracking-[0.34em]">Reputation</p>
            <h2 className="panel-title mt-3 text-3xl font-semibold">{level.title}</h2>
            <p className="panel-copy mt-3 text-sm leading-7">{level.note}</p>

            <div className="mt-5 grid gap-3">
              <div className="panel-muted-card rounded-[1.3rem] p-4">
                <p className="panel-kicker text-xs uppercase tracking-[0.28em]">Активность за неделю</p>
                <p className="panel-title mt-2 text-2xl font-semibold">{weeklyReports}</p>
              </div>
              <div className="panel-muted-card rounded-[1.3rem] p-4">
                <p className="panel-kicker text-xs uppercase tracking-[0.28em]">Главная категория</p>
                <p className="panel-title mt-2 text-xl font-semibold">{topCategory}</p>
              </div>
              <div className="panel-muted-card rounded-[1.3rem] p-4">
                <p className="panel-kicker text-xs uppercase tracking-[0.28em]">Последняя активность</p>
                <p className="panel-title mt-2 text-lg font-semibold">{latestAddress}</p>
              </div>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
