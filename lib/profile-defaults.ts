import type { AdminProfile, CitizenProfile } from "@/types";

export function getDefaultCitizenProfile(fullName: string | undefined): CitizenProfile {
  return {
    role: "citizen",
    displayName: getInitialCitizenName(fullName),
    district: "",
    bio: "Мне важно, чтобы город реагировал на проблемы быстрее и прозрачнее.",
    avatarUrl: null,
    hasStoredProfile: false,
  };
}

export function getDefaultAdminProfile(fullName: string | undefined): AdminProfile {
  return {
    role: "admin",
    displayName: getInitialAdminName(fullName),
    position: "Администратор",
    department: "Операторская служба",
    district: "",
    bio: "Координирую обработку обращений и слежу за тем, чтобы рабочий поток оставался понятным и управляемым.",
    categories: ["road", "light"],
    avatarUrl: null,
    hasStoredProfile: false,
  };
}

function getInitialCitizenName(fullName: string | undefined) {
  if (!fullName || isCorruptedPlaceholder(fullName)) {
    return "Гражданин";
  }

  return fullName.replace(/^демо[-\s]*/i, "").trim() || "Гражданин";
}

function getInitialAdminName(fullName: string | undefined) {
  if (!fullName || isCorruptedPlaceholder(fullName)) {
    return "Администратор";
  }

  return fullName.replace(/^демо[-\s]*/i, "").trim() || "Администратор";
}

function isCorruptedPlaceholder(value: string) {
  return /^\?+(?:\s+\?+)*$/u.test(value.trim());
}
