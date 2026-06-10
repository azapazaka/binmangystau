import { Buffer } from "node:buffer";

import { env } from "@/lib/env";
import { getDefaultAdminProfile, getDefaultCitizenProfile } from "@/lib/profile-defaults";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type {
  AdminProfile,
  ReportCategory,
  SaveUserProfileInput,
  UserProfile,
} from "@/types";
import type { SessionUser } from "@/lib/auth";

type UserProfileRow = {
  user_id: string;
  display_name: string | null;
  district: string | null;
  bio: string | null;
  avatar_path: string | null;
  position: string | null;
  department: string | null;
  categories: string[] | null;
  created_at: string;
  updated_at: string;
};

export async function getCurrentUserProfile(session: SessionUser): Promise<UserProfile> {
  const admin = createSupabaseAdminClient();
  const result = await admin
    .from("user_profiles")
    .select("*")
    .eq("user_id", session.id)
    .single();

  if (result.error || !result.data) {
    return createEmptyProfile(session);
  }

  return mapProfileRow(session, result.data as UserProfileRow, true);
}

export async function saveCurrentUserProfile(
  session: SessionUser,
  input: SaveUserProfileInput,
): Promise<UserProfile> {
  const admin = createSupabaseAdminClient();
  const existing = await admin
    .from("user_profiles")
    .select("*")
    .eq("user_id", session.id)
    .single();

  const existingRow = existing.data as UserProfileRow | null;
  const avatarPath = await resolveAvatarPath(admin, session.id, input.avatarUrl, existingRow?.avatar_path ?? null);
  const payload = {
    user_id: session.id,
    display_name: input.displayName.trim() || null,
    district: input.district.trim() || null,
    bio: input.bio.trim() || null,
    avatar_path: avatarPath,
    position: session.role === "admin" ? readAdminInput(input).position : null,
    department: session.role === "admin" ? readAdminInput(input).department : null,
    categories: session.role === "admin" ? readAdminInput(input).categories : [],
  };

  const upsert = await admin.from("user_profiles").upsert(payload);

  if (upsert.error) {
    throw upsert.error;
  }

  await syncAuthProfileMetadata(admin, session.id, payload.display_name, session.role);

  return mapProfileRow(
    {
      ...session,
      fullName: payload.display_name ?? session.fullName,
    },
    {
      ...(existingRow ?? {
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }),
      ...payload,
    } as UserProfileRow,
    true,
  );
}

function createEmptyProfile(session: SessionUser): UserProfile {
  if (session.role === "admin") {
    const fallback = getDefaultAdminProfile(session.fullName);

    return {
      role: "admin",
      displayName: fallback.displayName,
      district: fallback.district,
      bio: fallback.bio,
      avatarUrl: null,
      position: fallback.position,
      department: fallback.department,
      categories: fallback.categories,
      hasStoredProfile: false,
    };
  }

  const fallback = getDefaultCitizenProfile(session.fullName);

  return {
    role: "citizen",
    displayName: fallback.displayName,
    district: fallback.district,
    bio: fallback.bio,
    avatarUrl: null,
    hasStoredProfile: false,
  };
}

function mapProfileRow(session: SessionUser, row: UserProfileRow, hasStoredProfile: boolean): UserProfile {
  const citizenDefaultProfile = getDefaultCitizenProfile(session.fullName);
  const adminDefaultProfile =
    session.role === "admin" ? getDefaultAdminProfile(session.fullName) : null;

  const baseProfile = {
    displayName:
      sanitizeProfileText(row.display_name) ??
      sanitizeProfileText(session.fullName) ??
      (adminDefaultProfile?.displayName ?? citizenDefaultProfile.displayName),
    district: sanitizeProfileText(row.district) ?? (adminDefaultProfile?.district ?? citizenDefaultProfile.district),
    bio: sanitizeProfileText(row.bio) ?? (adminDefaultProfile?.bio ?? citizenDefaultProfile.bio),
    avatarUrl: row.avatar_path ? getAvatarPublicUrl(row.avatar_path) : null,
    hasStoredProfile,
  };

  if (session.role === "admin") {
    return {
      role: "admin",
      ...baseProfile,
      position: sanitizeProfileText(row.position) ?? adminDefaultProfile?.position ?? "",
      department: sanitizeProfileText(row.department) ?? adminDefaultProfile?.department ?? "",
      categories: normalizeCategories(row.categories),
    } satisfies AdminProfile;
  }

  return {
    role: "citizen",
    ...baseProfile,
  };
}

function getAvatarPublicUrl(path: string) {
  const admin = createSupabaseAdminClient();
  const { data } = admin.storage.from(env.supabaseAvatarBucket).getPublicUrl(path);
  return data.publicUrl;
}

async function resolveAvatarPath(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  userId: string,
  avatarUrl: string | null,
  existingAvatarPath: string | null,
) {
  if (!avatarUrl) {
    return null;
  }

  if (!avatarUrl.startsWith("data:")) {
    return existingAvatarPath;
  }

  const parsed = parseDataUrl(avatarUrl);
  const fileExtension = getFileExtension(parsed.mimeType);
  const path = `${userId}/${Date.now()}-avatar.${fileExtension}`;
  const upload = await admin.storage.from(env.supabaseAvatarBucket).upload(path, parsed.buffer, {
    contentType: parsed.mimeType,
    upsert: true,
  });

  if (upload.error) {
    throw upload.error;
  }

  return path;
}

async function syncAuthProfileMetadata(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  userId: string,
  displayName: string | null,
  role: SessionUser["role"],
) {
  const existing = await admin.auth.admin.getUserById(userId);
  const currentMetadata =
    (existing.data.user?.user_metadata as Record<string, unknown> | undefined) ?? {};

  const update = await admin.auth.admin.updateUserById(userId, {
    user_metadata: {
      ...currentMetadata,
      full_name: displayName ?? null,
      role,
    },
  });

  if (update.error) {
    throw update.error;
  }
}

function normalizeCategories(value: string[] | null) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter(isReportCategory);
}

function sanitizeProfileText(value: string | null | undefined) {
  const trimmed = value?.trim();

  if (!trimmed || /^\?+(?:\s+\?+)*$/u.test(trimmed)) {
    return null;
  }

  return trimmed;
}

function isReportCategory(value: string): value is ReportCategory {
  return value === "road" || value === "light" || value === "trash" || value === "traffic" || value === "other";
}

function readAdminInput(input: SaveUserProfileInput) {
  if (!("position" in input)) {
    return {
      position: null,
      department: null,
      categories: [],
    };
  }

  return {
    position: input.position.trim() || null,
    department: input.department.trim() || null,
    categories: normalizeCategories(input.categories),
  };
}

function parseDataUrl(value: string) {
  const match = /^data:([^;]+);base64,(.+)$/u.exec(value);

  if (!match?.[1] || !match[2]) {
    throw new Error("Invalid avatar payload.");
  }

  return {
    mimeType: match[1],
    buffer: Buffer.from(match[2], "base64"),
  };
}

function getFileExtension(mimeType: string) {
  if (mimeType === "image/png") {
    return "png";
  }

  if (mimeType === "image/webp") {
    return "webp";
  }

  return "jpg";
}
