// src/lib/constants.ts
import type { AiValidationStatus, ClusterStatus, ReportCategory } from "@/types";

export const APP_NAME = "CityPulse";

export const CATEGORY_META: Record<
  ReportCategory,
  { label: string; color: string; bgClass: string; textClass: string }
> = {
  road: {
    label: "Roads",
    color: "#ef4444",
    bgClass: "bg-red-100",
    textClass: "text-red-700",
  },
  light: {
    label: "Lights",
    color: "#f59e0b",
    bgClass: "bg-amber-100",
    textClass: "text-amber-700",
  },
  trash: {
    label: "Trash",
    color: "#22c55e",
    bgClass: "bg-green-100",
    textClass: "text-green-700",
  },
  traffic: {
    label: "Traffic",
    color: "#3b82f6",
    bgClass: "bg-blue-100",
    textClass: "text-blue-700",
  },
  other: {
    label: "Other",
    color: "#94a3b8",
    bgClass: "bg-slate-100",
    textClass: "text-slate-600",
  },
};

export const STATUS_META: Record<
  ClusterStatus,
  { label: string; bgClass: string; textClass: string }
> = {
  open: {
    label: "Open",
    bgClass: "bg-red-100",
    textClass: "text-red-700",
  },
  in_progress: {
    label: "In progress",
    bgClass: "bg-amber-100",
    textClass: "text-amber-700",
  },
  closed: {
    label: "Resolved",
    bgClass: "bg-green-100",
    textClass: "text-green-700",
  },
};

export const AI_STATUS_META: Record<
  AiValidationStatus,
  { label: string; bgClass: string; textClass: string }
> = {
  valid: {
    label: "Verified",
    bgClass: "bg-green-100",
    textClass: "text-green-700",
  },
  invalid: {
    label: "Rejected",
    bgClass: "bg-red-100",
    textClass: "text-red-700",
  },
  uncertain: {
    label: "Needs review",
    bgClass: "bg-amber-100",
    textClass: "text-amber-700",
  },
  unavailable: {
    label: "Unavailable",
    bgClass: "bg-slate-100",
    textClass: "text-slate-600",
  },
};

export const DEMO_ACCOUNTS = {
  citizen: { email: "citizen@citypulse.local", password: "citypulse-demo" },
  admin: { email: "demo@citypulse.local", password: "citypulse-demo" },
};
