import type { AccountRole, ReportCategory, SaveAdminProfileInput, SaveCitizenProfileInput } from "@/types";

type PendingProfileMigration =
  | { role: "citizen"; profile: SaveCitizenProfileInput }
  | { role: "admin"; profile: SaveAdminProfileInput };

type GetPendingProfileMigrationInput = {
  role: AccountRole;
  rawLocalStorageValue: string | null;
  hasStoredProfile: boolean;
};

export function getPendingProfileMigration({
  role,
  rawLocalStorageValue,
  hasStoredProfile,
}: GetPendingProfileMigrationInput): PendingProfileMigration | null {
  if (hasStoredProfile || !rawLocalStorageValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawLocalStorageValue) as Record<string, unknown>;
    const baseProfile = {
      displayName: readString(parsed.displayName),
      district: readString(parsed.district),
      bio: readString(parsed.bio),
      avatarUrl: readAvatarValue(parsed),
    };

    if (role === "admin") {
      return {
        role,
        profile: {
          ...baseProfile,
          position: readString(parsed.position),
          department: readString(parsed.department),
          categories: readCategories(parsed.categories),
        },
      };
    }

    return {
      role,
      profile: baseProfile,
    };
  } catch {
    return null;
  }
}

function readString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function readAvatarValue(parsed: Record<string, unknown>) {
  if (typeof parsed.avatarUrl === "string") {
    return parsed.avatarUrl;
  }

  if (typeof parsed.avatarDataUrl === "string") {
    return parsed.avatarDataUrl;
  }

  return null;
}

function readCategories(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isReportCategory);
}

function isReportCategory(value: unknown): value is ReportCategory {
  return value === "road" || value === "light" || value === "trash" || value === "traffic" || value === "other";
}
