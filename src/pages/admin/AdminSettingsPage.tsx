import {
  Bell,
  Database,
  LogOut,
  MapPin,
  Shield,
  Sparkles,
} from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { env, isMapboxConfigured, isSupabaseConfigured } from "@/lib/env";

export default function AdminSettingsPage() {
  const { user, signOut } = useAuth();

  return (
    <div className="space-y-4">
      <header>
        <p className="citizen-v2-eyebrow">Workspace controls</p>
        <h1 className="text-2xl font-black tracking-[-0.04em] text-slate-950">
          Settings
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-500">
          Review the current operator account, confirm integration health, and
          keep the admin workspace aligned with the live city environment.
        </p>
      </header>

      <div className="grid gap-4 xl:grid-cols-3">
        <section className="citizen-v2-panel">
          <div className="flex items-center gap-3">
            <Shield size={20} className="text-emerald-700" />
            <h2>Administrator account</h2>
          </div>
          <div className="mt-5 space-y-3 text-sm text-slate-600">
            <p>
              <span className="font-semibold text-slate-900">Name:</span>{" "}
              {user?.fullName ?? "Unknown"}
            </p>
            <p>
              <span className="font-semibold text-slate-900">Email:</span>{" "}
              {user?.email ?? "Unavailable"}
            </p>
            <p>
              <span className="font-semibold text-slate-900">Role:</span> Admin
            </p>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="mt-6 inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <LogOut size={16} />
            Sign out
          </button>
        </section>

        <section className="citizen-v2-panel">
          <div className="flex items-center gap-3">
            <Database size={20} className="text-sky-700" />
            <h2>Integration health</h2>
          </div>
          <div className="mt-5 space-y-3 text-sm text-slate-600">
            <p>
              <span className="font-semibold text-slate-900">Supabase:</span>{" "}
              {isSupabaseConfigured() ? "Connected" : "Missing env vars"}
            </p>
            <p>
              <span className="font-semibold text-slate-900">Mapbox:</span>{" "}
              {isMapboxConfigured() ? "Configured" : "Fallback map mode"}
            </p>
            <p>
              <span className="font-semibold text-slate-900">Default center:</span>{" "}
              {env.defaultLat}, {env.defaultLng}
            </p>
          </div>
        </section>

        <section className="citizen-v2-panel">
          <div className="flex items-center gap-3">
            <MapPin size={20} className="text-amber-700" />
            <h2>Operational context</h2>
          </div>
          <div className="mt-5 space-y-3 text-sm text-slate-600">
            <p>
              <span className="font-semibold text-slate-900">City:</span> Aktau
            </p>
            <p>
              <span className="font-semibold text-slate-900">Cluster radius:</span>{" "}
              {env.clusterRadiusMeters} meters
            </p>
            <p>
              <span className="font-semibold text-slate-900">Mode:</span>{" "}
              Live civic operations
            </p>
          </div>
        </section>

        <section className="citizen-v2-panel xl:col-span-2">
          <div className="flex items-center gap-3">
            <Bell size={20} className="text-violet-700" />
            <h2>Alerting posture</h2>
          </div>
          <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-600">
            This admin workspace is currently optimized for review-first
            operations. AI classification is active, cluster prioritization is
            live, and moderators can use the map, reports, and community views
            to decide where manual intervention is still needed.
          </p>
        </section>

        <section className="citizen-v2-panel">
          <div className="flex items-center gap-3">
            <Sparkles size={20} className="text-emerald-700" />
            <h2>Product posture</h2>
          </div>
          <p className="mt-5 text-sm leading-7 text-slate-600">
            This Vite app now owns the deployable surface. Parked Next
            experiments remain outside the production routes until they are
            intentionally integrated.
          </p>
        </section>
      </div>
    </div>
  );
}
