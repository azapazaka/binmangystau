import { existsSync } from "node:fs";
import path from "node:path";

import nextEnv from "@next/env";
import { createClient } from "@supabase/supabase-js";

const projectDir = process.cwd();
const { loadEnvConfig } = nextEnv;
loadEnvConfig(projectDir);

const requiredEnvKeys = [
  "NEXT_PUBLIC_SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
];

const envCandidates = [
  path.join(projectDir, ".env.local"),
  path.join(projectDir, ".env"),
];
const hasLocalEnvFile = envCandidates.some((candidate) => existsSync(candidate));

for (const key of requiredEnvKeys) {
  if (!process.env[key]?.trim()) {
    const envHint = hasLocalEnvFile
      ? `Environment file exists, but ${key} is missing.`
      : "Create .env.local from .env.example or export the variables in your shell first.";
    throw new Error(`Missing required environment variable: ${key}. ${envHint}`);
  }
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  },
);

const reportBucket = process.env.SUPABASE_STORAGE_BUCKET?.trim() || "reports";
const avatarBucket = process.env.SUPABASE_AVATAR_BUCKET?.trim() || "avatars";

await ensureBucket({
  id: reportBucket,
  isPublic: true,
  maxFileSize: 10 * 1024 * 1024,
  allowedMimeTypes: ["image/png", "image/jpeg", "image/webp"],
});

await ensureBucket({
  id: avatarBucket,
  isPublic: true,
  maxFileSize: 3 * 1024 * 1024,
  allowedMimeTypes: ["image/png", "image/jpeg", "image/webp"],
});

const demoAccounts = [
  {
    role: "citizen",
    email: "citizen@citypulse.local",
    password: "citypulse-demo",
    fullName: "Демо-гражданин",
    profile: {
      display_name: "Гражданин",
      district: null,
      bio: "Мне важно, чтобы город реагировал на проблемы быстрее и прозрачнее.",
      avatar_path: null,
      position: null,
      department: null,
      categories: [],
    },
  },
  {
    role: "admin",
    email: "demo@citypulse.local",
    password: "citypulse-demo",
    fullName: "Демо-администратор CityPulse",
    profile: {
      display_name: "Администратор",
      district: null,
      bio: "Координирую обработку обращений и слежу за тем, чтобы рабочий поток оставался понятным и управляемым.",
      avatar_path: null,
      position: "Администратор",
      department: "Операторская служба",
      categories: ["road", "light"],
    },
  },
];

const existingUsers = [];
let page = 1;

while (true) {
  const { data, error } = await supabase.auth.admin.listUsers({
    page,
    perPage: 200,
  });

  if (error) {
    throw error;
  }

  existingUsers.push(...data.users);

  if (data.users.length < 200) {
    break;
  }

  page += 1;
}

for (const account of demoAccounts) {
  const existingUser = existingUsers.find((user) => user.email === account.email);
  const userMetadata = {
    role: account.role,
    full_name: account.fullName,
  };

  let userId = existingUser?.id;

  if (existingUser) {
    const { error } = await supabase.auth.admin.updateUserById(existingUser.id, {
      email: account.email,
      password: account.password,
      email_confirm: true,
      user_metadata: {
        ...(existingUser.user_metadata ?? {}),
        ...userMetadata,
      },
    });

    if (error) {
      throw error;
    }
  } else {
    const { data, error } = await supabase.auth.admin.createUser({
      email: account.email,
      password: account.password,
      email_confirm: true,
      user_metadata: userMetadata,
    });

    if (error) {
      throw error;
    }

    userId = data.user.id;
  }

  if (!userId) {
    throw new Error(`Could not resolve user id for ${account.email}`);
  }

  const { error: profileError } = await supabase.from("user_profiles").upsert({
    user_id: userId,
    ...account.profile,
  });

  if (profileError) {
    throw profileError;
  }

  const { error: publicUserError } = await supabase
    .from("users")
    .update({
      full_name: account.fullName,
      role: account.role,
    })
    .eq("id", userId);

  if (publicUserError) {
    throw publicUserError;
  }

  console.log(`Prepared demo account: ${account.email}`);
}

console.log("Demo account bootstrap completed.");

async function ensureBucket({ id, isPublic, maxFileSize, allowedMimeTypes }) {
  const { data: existingBuckets, error: listError } = await supabase.storage.listBuckets();

  if (listError) {
    throw listError;
  }

  const existingBucket = existingBuckets.find((bucket) => bucket.id === id);

  if (!existingBucket) {
    const { error: createError } = await supabase.storage.createBucket(id, {
      public: isPublic,
      fileSizeLimit: maxFileSize,
      allowedMimeTypes,
    });

    if (createError) {
      throw createError;
    }

    console.log(`Prepared storage bucket: ${id}`);
    return;
  }

  const { error: updateError } = await supabase.storage.updateBucket(id, {
    public: isPublic,
    fileSizeLimit: maxFileSize,
    allowedMimeTypes,
  });

  if (updateError) {
    throw updateError;
  }

  console.log(`Validated storage bucket: ${id}`);
}
