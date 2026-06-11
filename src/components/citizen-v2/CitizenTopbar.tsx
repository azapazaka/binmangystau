import type { ReactNode } from "react";

import { ChevronDown } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";

export function CitizenTopbar({ action }: { action?: ReactNode }) {
  const { user } = useAuth();
  const profileName = user?.fullName?.trim() || "Житель";
  const profileRole = user?.role === "admin" ? "Администратор" : "Житель";

  return (
    <div className="citizen-v2-topbar">
      <div className="citizen-v2-topbar-spacer" />
      <div className="citizen-v2-topbar-actions">
        <button type="button" className="citizen-v2-profile-button">
          <span className="citizen-v2-avatar" aria-hidden="true">
            {profileName.charAt(0).toUpperCase()}
          </span>
          <span className="citizen-v2-profile-copy">
            <span className="citizen-v2-profile-name">{profileName}</span>
            <span className="citizen-v2-profile-role">{profileRole}</span>
          </span>
          <ChevronDown size={16} />
        </button>
        {action}
      </div>
    </div>
  );
}
