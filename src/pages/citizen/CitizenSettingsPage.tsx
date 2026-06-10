import { Bell, MapPin, Shield } from "lucide-react";

import { CitizenShell } from "@/components/citizen-v2/CitizenShell";
import { useAuth } from "@/contexts/AuthContext";

export default function CitizenSettingsPage() {
  const { user, signOut } = useAuth();

  return (
    <CitizenShell title="Settings" subtitle="Manage your account controls and local preferences.">
      <div className="grid gap-5 xl:grid-cols-3">
        <article className="citizen-v2-panel">
          <div className="flex items-center gap-3">
            <Shield size={22} className="text-emerald-700" />
            <h2>Account</h2>
          </div>
          <div className="mt-5 space-y-3 text-sm text-slate-600">
            <p><span className="font-semibold text-slate-900">Name:</span> {user?.fullName ?? "Citizen"}</p>
            <p><span className="font-semibold text-slate-900">Email:</span> {user?.email ?? "Unavailable"}</p>
            <p><span className="font-semibold text-slate-900">Role:</span> Citizen</p>
          </div>
          <button type="button" onClick={signOut} className="mt-6 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700">
            Sign out
          </button>
        </article>

        <article className="citizen-v2-panel">
          <div className="flex items-center gap-3">
            <MapPin size={22} className="text-teal-700" />
            <h2>Location</h2>
          </div>
          <p className="mt-5 text-sm leading-7 text-slate-600">
            Aktau is now the default citizen context for this React experience. District-level preferences will land in a later pass once profile persistence is wired here.
          </p>
        </article>

        <article className="citizen-v2-panel">
          <div className="flex items-center gap-3">
            <Bell size={22} className="text-amber-700" />
            <h2>Notifications</h2>
          </div>
          <p className="mt-5 text-sm leading-7 text-slate-600">
            Notification preferences are not yet configurable from the Vite citizen app. This shell keeps the route consistent with the new navigation.
          </p>
        </article>
      </div>
    </CitizenShell>
  );
}
