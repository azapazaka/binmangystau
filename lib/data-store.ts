import { isAfter, subDays } from "date-fns";

import { classifyReportImage } from "@/lib/ai/classify-report-image";
import { analyzeReportWithProvider } from "@/lib/ai/provider";
import { findMatchingCluster } from "@/lib/clustering";
import { env } from "@/lib/env";
import { forwardGeocode, reverseGeocode } from "@/lib/geocoding";
import { getHumanConfirmationStatus } from "@/lib/human-confirmation";
import { buildPriorityAssessment, getEffectiveCategory, getEffectiveVisualSeverity } from "@/lib/priority";
import { calculateSeverity } from "@/lib/severity";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import type {
  AiVisualSeverity,
  ClusterRecord,
  ClusterStatus,
  DashboardStats,
  HumanVoteVerdict,
  NewReportInput,
  PriorityFactor,
  ReportCategory,
  ReportDeepAnalysis,
  ReportRecord,
  ReviewReportInput,
  StatusHistoryRecord,
} from "@/types";

type ClusterFilters = {
  category?: ReportCategory | "all";
  period?: "week" | "month" | "all";
};

export type AdminClusterDetail = {
  report: ReportRecord | null;
  history: StatusHistoryRecord[];
};

export type ReviewReportResult = {
  report: ReportRecord;
  cluster: ClusterRecord;
  stats: DashboardStats;
};

type CitizenVerificationQueueOptions = {
  limit?: number;
  includeReviewed?: boolean;
};

type UserProfileRowLike = Record<string, unknown>;

export async function listClusters(filters: ClusterFilters = {}) {
  const admin = createSupabaseAdminClient();
  let query = admin
    .from("clusters")
    .select("*")
    .order("priority_score", { ascending: false })
    .order("severity", { ascending: false })
    .order("updated_at", { ascending: false });

  if (filters.category && filters.category !== "all") {
    query = query.eq("category", filters.category);
  }

  if (filters.period === "week") {
    query = query.gte("updated_at", subDays(new Date(), 7).toISOString());
  }

  if (filters.period === "month") {
    query = query.gte("updated_at", subDays(new Date(), 30).toISOString());
  }

  const [clustersResult, reportsResult] = await Promise.all([
    query,
    admin.from("reports").select("*"),
  ]);

  if (clustersResult.error) {
    throw clustersResult.error;
  }

  if (reportsResult.error) {
    throw reportsResult.error;
  }

  const enrichedState = recomputePriorityState({
    clusters: (clustersResult.data ?? []).map(mapClusterRow),
    reports: (reportsResult.data ?? []).map(mapReportRow),
    history: [],
  });

  return enrichedState.clusters
    .filter((cluster) => {
      if (filters.category && filters.category !== "all" && cluster.category !== filters.category) {
        return false;
      }

      if (filters.period === "week" && !isRecent(cluster.updatedAt, 7)) {
        return false;
      }

      if (filters.period === "month" && !isRecent(cluster.updatedAt, 30)) {
        return false;
      }

      return true;
    })
    .sort(
      (left, right) =>
        right.priorityScore - left.priorityScore ||
        right.severity - left.severity ||
        new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
    );
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const admin = createSupabaseAdminClient();
  const [reportsResult, weeklyResult, inProgressResult, resolvedResult, reviewMetricsResult] =
    await Promise.all([
      admin.from("reports").select("id", { count: "exact", head: true }),
      admin
        .from("reports")
        .select("id", { count: "exact", head: true })
        .gte("created_at", subDays(new Date(), 7).toISOString()),
      admin
        .from("clusters")
        .select("id", { count: "exact", head: true })
        .eq("status", "in_progress"),
      admin
        .from("clusters")
        .select("id", { count: "exact", head: true })
        .eq("status", "closed"),
      admin.from("reports").select("review_status, ai_correct"),
    ]);

  if (reportsResult.error) {
    throw reportsResult.error;
  }

  if (weeklyResult.error) {
    throw weeklyResult.error;
  }

  if (inProgressResult.error) {
    throw inProgressResult.error;
  }

  if (resolvedResult.error) {
    throw resolvedResult.error;
  }

  if (reviewMetricsResult.error) {
    throw reviewMetricsResult.error;
  }

  const reviewedReports =
    reviewMetricsResult.data?.filter((report) => report.review_status !== "pending").length ?? 0;
  const aiCorrectReports =
    reviewMetricsResult.data?.filter((report) => report.ai_correct === true).length ?? 0;
  const correctedReports =
    reviewMetricsResult.data?.filter((report) => report.review_status === "corrected").length ?? 0;

  return {
    totalReports: reportsResult.count ?? 0,
    weeklyReports: weeklyResult.count ?? 0,
    inProgress: inProgressResult.count ?? 0,
    resolved: resolvedResult.count ?? 0,
    reviewedReports,
    aiCorrectReports,
    correctedReports,
    aiAgreementRate:
      reviewedReports > 0 ? Math.round((aiCorrectReports / reviewedReports) * 100) : 0,
  };
}

export async function listReports(
  filters: { submittedBy?: string | null; clusterId?: string | null } = {},
) {
  const admin = createSupabaseAdminClient();
  let query = admin.from("reports").select("*").order("created_at", { ascending: false });

  if (filters.submittedBy) {
    query = query.eq("submitted_by", filters.submittedBy);
  }

  if (filters.clusterId) {
    query = query.eq("cluster_id", filters.clusterId);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapReportRow);
}

export async function listCitizenVerificationQueue(
  userId: string,
  options: CitizenVerificationQueueOptions = {},
) {
  const admin = createSupabaseAdminClient();
  const limit = options.limit ?? 8;
  const includeReviewed = options.includeReviewed ?? false;
  const [reportsResult, votesResult] = await Promise.all([
    admin.from("reports").select("*"),
    admin.from("report_human_votes").select("*"),
  ]);

  if (reportsResult.error) {
    throw reportsResult.error;
  }

  if (votesResult.error) {
    throw votesResult.error;
  }

  const votedReportIds = new Set(
    (votesResult.data ?? [])
      .filter((vote) => String(vote.user_id) === userId)
      .map((vote) => String(vote.report_id)),
  );

  return (reportsResult.data ?? [])
    .map(mapReportRow)
    .filter(
      (report) =>
        report.status !== "closed" && (includeReviewed || !votedReportIds.has(report.id)),
    )
    .sort(compareCitizenVerificationReports)
    .slice(0, limit);
}

export async function upsertHumanVoteForReport(
  reportId: string,
  userId: string,
  verdict: HumanVoteVerdict,
) {
  const admin = createSupabaseAdminClient();
  const voteUpdate = await admin
    .from("report_human_votes")
    .upsert(
      {
        report_id: reportId,
        user_id: userId,
        verdict,
      },
      {
        onConflict: "report_id,user_id",
      },
    );

  if (voteUpdate.error) {
    throw voteUpdate.error;
  }

  return recomputeHumanConfirmationSnapshot(admin, reportId);
}

export async function createReport(input: NewReportInput) {
  const admin = createSupabaseAdminClient();
  const location = await resolveReportLocation(input);
  const photoUrl = await createPhotoUrl(input.photo);
  const aiResult = await classifyReportImage({
    imageUrl: photoUrl,
    userCategory: input.category,
    description: input.description ?? "",
  });
  const existingRows = await admin
    .from("clusters")
    .select("*")
    .eq("category", input.category);

  if (existingRows.error) {
    throw existingRows.error;
  }

  const existingCluster = findMatchingCluster({
    category: input.category,
    lat: location.lat,
    lng: location.lng,
    clusters: (existingRows.data ?? []).map(mapClusterRow),
  });

  const reportCount = (existingCluster?.reportCount ?? 0) + 1;
  const severity = calculateSeverity({
    reportCount,
    category: input.category,
    zoneCoefficient: location.zoneCoefficient,
  });

  let clusterId = existingCluster?.id;

  if (existingCluster) {
    const clusterUpdate = await admin
      .from("clusters")
      .update({
        report_count: reportCount,
        severity,
        representative_photo_url: existingCluster.representativePhotoUrl ?? photoUrl,
        ai_validation_status: aiResult.aiValidationStatus,
      })
      .eq("id", existingCluster.id);

    if (clusterUpdate.error) {
      throw clusterUpdate.error;
    }
  } else {
    const inserted = await admin
      .from("clusters")
      .insert({
        category: input.category,
        lat: location.lat,
        lng: location.lng,
        address: location.address,
        district: location.district,
        zone_key: location.zoneKey,
        zone_coefficient: location.zoneCoefficient,
        report_count: 1,
        severity,
        priority_score: 0,
        priority_reason: null,
        top_factors: [],
        priority_source_report_id: null,
        representative_photo_url: photoUrl,
        ai_validation_status: aiResult.aiValidationStatus,
      })
      .select("*")
      .single();

    if (inserted.error) {
      throw inserted.error;
    }

    clusterId = inserted.data?.id as string | undefined;
  }

  if (!clusterId) {
    throw new Error("Cluster id was not created for the new report.");
  }

  const insertedReport = await admin
    .from("reports")
    .insert({
      cluster_id: clusterId,
      user_category: input.category,
      description: input.description ?? "",
      photo_url: photoUrl,
      lat: location.lat,
      lng: location.lng,
      address: location.address,
      district: location.district,
      severity,
      ai_priority_score: 0,
      ai_priority_reason: null,
      ai_top_factors: [],
      review_status: "pending",
      ai_correct: null,
      expert_category: null,
      expert_visual_severity: null,
      review_note: null,
      reviewed_by: null,
      reviewed_at: null,
      status: existingCluster?.status ?? "open",
      ai_category: aiResult.aiCategory,
      ai_confidence: aiResult.aiConfidence,
      ai_tags: aiResult.aiTags,
      ai_validation_status: aiResult.aiValidationStatus,
      ai_needs_review: aiResult.aiNeedsReview,
      ai_reason: aiResult.aiReason,
      ai_visual_severity: aiResult.aiVisualSeverity,
      ai_deep_analysis: null,
      ai_deep_analyzed_at: null,
      ai_raw: aiResult,
      submitted_by: input.submittedBy ?? null,
    })
    .select("*")
    .single();

  if (insertedReport.error) {
    throw insertedReport.error;
  }

  const snapshot = await recomputeSupabasePrioritySnapshot(admin);

  return snapshot.reports.find((report) => report.id === insertedReport.data?.id) ?? null;
}

async function resolveReportLocation(input: NewReportInput) {
  if (input.locationSource === "geolocation" || input.locationSource === "map") {
    const reverseGeocodedLocation = await reverseGeocode(input.lat!, input.lng!);

    return {
      ...reverseGeocodedLocation,
      address: input.addressLabel?.trim() || reverseGeocodedLocation.address,
    };
  }

  if (input.manualAddress) {
    return forwardGeocode(input.manualAddress);
  }

  return reverseGeocode(input.lat!, input.lng!);
}

export async function updateClusterStatus(
  clusterId: string,
  nextStatus: ClusterStatus,
  changedBy: string | null,
) {
  const admin = createSupabaseAdminClient();
  const current = await admin.from("clusters").select("*").eq("id", clusterId).single();

  if (current.error) {
    throw current.error;
  }

  if (!current.data) {
    return null;
  }

  const [clusterUpdate, reportsUpdate, historyInsert] = await Promise.all([
    admin.from("clusters").update({ status: nextStatus }).eq("id", clusterId),
    admin.from("reports").update({ status: nextStatus }).eq("cluster_id", clusterId),
    admin.from("status_history").insert({
      cluster_id: clusterId,
      old_status: current.data.status,
      new_status: nextStatus,
      changed_by: changedBy,
    }),
  ]);

  if (clusterUpdate.error) {
    throw clusterUpdate.error;
  }

  if (reportsUpdate.error) {
    throw reportsUpdate.error;
  }

  if (historyInsert.error) {
    throw historyInsert.error;
  }

  const snapshot = await recomputeSupabasePrioritySnapshot(admin);

  return snapshot.clusters.find((cluster) => cluster.id === clusterId) ?? {
    ...mapClusterRow(current.data),
    status: nextStatus,
  };
}

export async function reviewReportByAdmin(
  reportId: string,
  input: ReviewReportInput,
): Promise<ReviewReportResult | null> {
  const admin = createSupabaseAdminClient();
  const reviewedAt = new Date().toISOString();
  const reviewFields = buildReviewFields(input, reviewedAt);
  const existing = await admin.from("reports").select("*").eq("id", reportId).single();

  if (existing.error) {
    throw existing.error;
  }

  if (!existing.data) {
    return null;
  }

  const updated = await admin
    .from("reports")
    .update({
      review_status: reviewFields.review_status,
      ai_correct: reviewFields.ai_correct,
      expert_category: reviewFields.expert_category,
      expert_visual_severity: reviewFields.expert_visual_severity,
      review_note: reviewFields.review_note,
      reviewed_by: reviewFields.reviewed_by,
      reviewed_at: reviewFields.reviewed_at,
    })
    .eq("id", reportId);

  if (updated.error) {
    throw updated.error;
  }

  const snapshot = await recomputeSupabasePrioritySnapshot(admin);
  const report = snapshot.reports.find((item) => item.id === reportId);

  if (!report) {
    return null;
  }

  const cluster = snapshot.clusters.find((item) => item.id === report.clusterId);

  if (!cluster) {
    return null;
  }

  return {
    report,
    cluster,
    stats: await getDashboardStats(),
  };
}

function buildReviewFields(input: ReviewReportInput, reviewedAt: string) {
  const trimmedNote = input.note?.trim() || null;

  if (input.verdict === "confirmed") {
    return {
      review_status: "confirmed" as const,
      ai_correct: true,
      expert_category: null,
      expert_visual_severity: null,
      review_note: trimmedNote,
      reviewed_by: input.reviewedBy,
      reviewed_at: reviewedAt,
    };
  }

  if (input.verdict === "invalidated") {
    return {
      review_status: "invalidated" as const,
      ai_correct: false,
      expert_category: null,
      expert_visual_severity: null,
      review_note: trimmedNote,
      reviewed_by: input.reviewedBy,
      reviewed_at: reviewedAt,
    };
  }

  return {
    review_status: "corrected" as const,
    ai_correct: false,
    expert_category: input.correctedCategory ?? null,
    expert_visual_severity: input.correctedVisualSeverity ?? null,
    review_note: trimmedNote,
    reviewed_by: input.reviewedBy,
    reviewed_at: reviewedAt,
  };
}

async function recomputeSupabasePrioritySnapshot(admin: ReturnType<typeof createSupabaseAdminClient>) {
  const [clustersResult, reportsResult] = await Promise.all([
    admin.from("clusters").select("*"),
    admin.from("reports").select("*"),
  ]);

  if (clustersResult.error) {
    throw clustersResult.error;
  }

  if (reportsResult.error) {
    throw reportsResult.error;
  }

  const state = recomputePriorityState({
    clusters: (clustersResult.data ?? []).map(mapClusterRow),
    reports: (reportsResult.data ?? []).map(mapReportRow),
    history: [],
  });

  const updates = await Promise.all([
    ...state.clusters.map((cluster) => updateClusterPrioritySnapshot(admin, cluster)),
    ...state.reports.map((report) =>
      admin
        .from("reports")
        .update({
          ai_priority_score: report.priorityScore,
          ai_priority_reason: report.priorityReason,
          ai_top_factors: report.topFactors,
        })
        .eq("id", report.id),
    ),
  ]);

  const failedUpdate = updates.find((result) => result.error);

  if (failedUpdate?.error) {
    throw failedUpdate.error;
  }

  return state;
}

async function updateClusterPrioritySnapshot(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  cluster: ClusterRecord,
) {
  const fullUpdate = await admin
    .from("clusters")
    .update({
      priority_score: cluster.priorityScore,
      priority_reason: cluster.priorityReason,
      top_factors: cluster.topFactors,
      priority_source_report_id: cluster.prioritySourceReportId,
      effective_category: cluster.effectiveCategory,
      effective_visual_severity: cluster.effectiveVisualSeverity,
      moderator_review_status: cluster.moderatorReviewStatus,
    })
    .eq("id", cluster.id);

  if (!isMissingClusterSnapshotColumnError(fullUpdate.error)) {
    return fullUpdate;
  }

  return admin
    .from("clusters")
    .update({
      priority_score: cluster.priorityScore,
      priority_reason: cluster.priorityReason,
      top_factors: cluster.topFactors,
      priority_source_report_id: cluster.prioritySourceReportId,
    })
    .eq("id", cluster.id);
}

function isMissingClusterSnapshotColumnError(error: { code?: string; message?: string } | null) {
  if (!error || error.code !== "PGRST204") {
    return false;
  }

  return [
    "effective_category",
    "effective_visual_severity",
    "moderator_review_status",
  ].some((column) => error.message?.includes(column));
}

export async function listStatusHistory(clusterId: string) {
  const admin = createSupabaseAdminClient();
  const { data, error } = await admin
    .from("status_history")
    .select("*")
    .eq("cluster_id", clusterId)
    .order("changed_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map(mapHistoryRow);
}

export async function getClusterDetailForAdmin(
  clusterId: string,
): Promise<AdminClusterDetail> {
  const [reports, history, clusters] = await Promise.all([
    listReports({ clusterId }),
    listStatusHistory(clusterId),
    listClusters({ period: "all" }),
  ]);

  const cluster = clusters.find((item) => item.id === clusterId) ?? null;
  const latestReport =
    (cluster?.prioritySourceReportId
      ? reports.find((report) => report.id === cluster.prioritySourceReportId)
      : null) ??
    reports.sort((left, right) => right.priorityScore - left.priorityScore)[0] ??
    null;

  if (!latestReport) {
    return { report: null, history };
  }

  const analyzedReport = await ensureReportDeepAnalysis(latestReport.id);

  return {
    report: analyzedReport ?? latestReport,
    history,
  };
}

export async function ensureReportDeepAnalysis(reportId: string) {
  const admin = createSupabaseAdminClient();
  const existing = await admin.from("reports").select("*").eq("id", reportId).single();

  if (existing.error) {
    throw existing.error;
  }

  if (!existing.data) {
    return null;
  }

  const report = mapReportRow(existing.data);

  if (report.aiDeepAnalysis) {
    return report;
  }

  const deepAnalysis = await analyzeReportWithProvider({
    imageUrl: report.photoUrl,
    userCategory: report.userCategory,
    description: report.description,
    address: report.address,
    aiReason: report.aiReason,
    aiVisualSeverity: report.aiVisualSeverity,
    aiTags: report.aiTags,
  });
  const analyzedAt = new Date().toISOString();
  const updated = await admin
    .from("reports")
    .update({
      ai_deep_analysis: deepAnalysis,
      ai_deep_analyzed_at: analyzedAt,
    })
    .eq("id", reportId)
    .select("*")
    .single();

  if (updated.error) {
    throw updated.error;
  }

  return updated.data
    ? mapReportRow(updated.data)
    : { ...report, aiDeepAnalysis: deepAnalysis, aiDeepAnalyzedAt: analyzedAt };
}

async function createPhotoUrl(file: File) {
  const arrayBuffer = await file.arrayBuffer();
  const admin = createSupabaseAdminClient();
  const path = `reports/${Date.now()}-${crypto.randomUUID()}.${getUploadExtension(file)}`;
  const upload = await admin.storage
    .from(env.supabaseStorageBucket)
    .upload(path, arrayBuffer, {
      contentType: file.type || "image/jpeg",
      upsert: false,
    });

  if (upload.error) {
    throw upload.error;
  }

  const { data } = admin.storage.from(env.supabaseStorageBucket).getPublicUrl(path);
  return data.publicUrl;
}

async function recomputeHumanConfirmationSnapshot(
  admin: ReturnType<typeof createSupabaseAdminClient>,
  reportId: string,
) {
  const [reportResult, votesResult] = await Promise.all([
    admin.from("reports").select("*").eq("id", reportId).single(),
    admin.from("report_human_votes").select("*").eq("report_id", reportId),
  ]);

  if (reportResult.error) {
    throw reportResult.error;
  }

  if (votesResult.error) {
    throw votesResult.error;
  }

  if (!reportResult.data) {
    return null;
  }

  const realVotes = (votesResult.data ?? []).filter((vote) => vote.verdict === "real").length;
  const fakeVotes = (votesResult.data ?? []).filter((vote) => vote.verdict === "fake").length;
  const totalVotes = realVotes + fakeVotes;
  const lastVotedAt =
    (votesResult.data ?? [])
      .map((vote) => String(vote.updated_at ?? vote.created_at ?? ""))
      .filter(Boolean)
      .sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0] ?? null;

  const update = await admin
    .from("reports")
    .update({
      human_real_votes: realVotes,
      human_fake_votes: fakeVotes,
      human_votes_total: totalVotes,
      human_confirmation_status: getHumanConfirmationStatus(realVotes, fakeVotes),
      human_last_voted_at: lastVotedAt,
    })
    .eq("id", reportId)
    .select("*")
    .single();

  if (update.error) {
    throw update.error;
  }

  return update.data ? mapReportRow(update.data) : mapReportRow(reportResult.data);
}

function compareCitizenVerificationReports(left: ReportRecord, right: ReportRecord) {
  if (left.reviewStatus !== right.reviewStatus) {
    return left.reviewStatus === "pending" ? -1 : 1;
  }

  const leftNeedsAttention = left.aiNeedsReview || left.aiValidationStatus !== "valid";
  const rightNeedsAttention = right.aiNeedsReview || right.aiValidationStatus !== "valid";

  if (leftNeedsAttention !== rightNeedsAttention) {
    return leftNeedsAttention ? -1 : 1;
  }

  if (left.humanVotesTotal !== right.humanVotesTotal) {
    return left.humanVotesTotal - right.humanVotesTotal;
  }

  return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
}

function getUploadExtension(file: File) {
  if (file.type === "image/png") {
    return "png";
  }

  if (file.type === "image/webp") {
    return "webp";
  }

  if (file.type === "image/jpeg") {
    return "jpg";
  }

  const name = file.name.toLowerCase();

  if (name.endsWith(".png")) {
    return "png";
  }

  if (name.endsWith(".webp")) {
    return "webp";
  }

  return "jpg";
}

function isRecent(isoDate: string, days: number) {
  return isAfter(new Date(isoDate), subDays(new Date(), days));
}

type PriorityState = {
  clusters: ClusterRecord[];
  reports: ReportRecord[];
  history: StatusHistoryRecord[];
};

function normalizeClusterRecord(cluster: ClusterRecord): ClusterRecord {
  return {
    ...cluster,
    effectiveCategory: cluster.effectiveCategory ?? cluster.category,
    zoneCoefficient: cluster.zoneCoefficient ?? 1,
    priorityScore: cluster.priorityScore ?? 0,
    priorityReason: cluster.priorityReason ?? null,
    topFactors: Array.isArray(cluster.topFactors) ? cluster.topFactors : [],
    prioritySourceReportId: cluster.prioritySourceReportId ?? null,
    effectiveVisualSeverity: cluster.effectiveVisualSeverity ?? null,
    moderatorReviewStatus: cluster.moderatorReviewStatus ?? "pending",
  };
}

function normalizeReportRecord(report: ReportRecord): ReportRecord {
  return {
    ...report,
    priorityScore: report.priorityScore ?? 0,
    priorityReason: report.priorityReason ?? null,
    topFactors: Array.isArray(report.topFactors) ? report.topFactors : [],
    reviewStatus: report.reviewStatus ?? "pending",
    aiCorrect: report.aiCorrect ?? null,
    expertCategory: report.expertCategory ?? null,
    expertVisualSeverity: report.expertVisualSeverity ?? null,
    reviewNote: report.reviewNote ?? null,
    reviewedBy: report.reviewedBy ?? null,
    reviewedAt: report.reviewedAt ?? null,
  };
}

function recomputePriorityState(state: PriorityState): PriorityState {
  const clusters = state.clusters.map(normalizeClusterRecord);
  const reports = state.reports.map(normalizeReportRecord);
  const clusterMap = new Map(clusters.map((cluster) => [cluster.id, cluster]));

  const nextReports = reports.map((report) => {
    const cluster = clusterMap.get(report.clusterId);

    if (!cluster) {
      return report;
    }

    const assessment = buildPriorityAssessment({
      report,
      cluster,
      nearbyOpenClusters: clusters,
      zoneCoefficient: cluster.zoneCoefficient,
    });

    return {
      ...report,
      priorityScore: assessment.priorityScore,
      priorityReason: assessment.priorityReason,
      topFactors: assessment.topFactors,
    };
  });

  const nextClusters = clusters.map((cluster) => {
    const sourceReport =
      nextReports
        .filter((report) => report.clusterId === cluster.id)
        .sort((left, right) => {
          if (right.priorityScore !== left.priorityScore) {
            return right.priorityScore - left.priorityScore;
          }

          return new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime();
        })[0] ?? null;

    return {
      ...cluster,
      effectiveCategory: sourceReport ? getEffectiveCategory(sourceReport) : cluster.category,
      priorityScore: sourceReport?.priorityScore ?? 0,
      priorityReason: sourceReport?.priorityReason ?? null,
      topFactors: sourceReport?.topFactors ?? [],
      prioritySourceReportId: sourceReport?.id ?? null,
      effectiveVisualSeverity: sourceReport ? getEffectiveVisualSeverity(sourceReport) : null,
      moderatorReviewStatus: sourceReport?.reviewStatus ?? "pending",
    };
  });

  return {
    ...state,
    clusters: nextClusters,
    reports: nextReports,
  };
}

function mapClusterRow(row: UserProfileRowLike): ClusterRecord {
  return {
    id: String(row.id),
    category: row.category as ReportCategory,
    effectiveCategory:
      (row.effective_category as ReportCategory | null) ??
      (row.effectiveCategory as ReportCategory | null) ??
      (row.category as ReportCategory),
    lat: Number(row.lat),
    lng: Number(row.lng),
    address: (row.address as string | null) ?? null,
    district: (row.district as string | null) ?? null,
    zoneCoefficient: Number(row.zone_coefficient ?? row.zoneCoefficient ?? 1),
    reportCount: Number(row.report_count ?? row.reportCount ?? 0),
    severity: Number(row.severity ?? 0),
    priorityScore: Number(row.priority_score ?? row.priorityScore ?? 0),
    priorityReason:
      (row.priority_reason as string | null) ??
      (row.priorityReason as string | null) ??
      null,
    topFactors: Array.isArray(row.top_factors)
      ? (row.top_factors as PriorityFactor[])
      : Array.isArray(row.topFactors)
        ? (row.topFactors as PriorityFactor[])
        : [],
    prioritySourceReportId:
      (row.priority_source_report_id as string | null) ??
      (row.prioritySourceReportId as string | null) ??
      null,
    status: row.status as ClusterStatus,
    representativePhotoUrl:
      (row.representative_photo_url as string | null) ??
      (row.representativePhotoUrl as string | null) ??
      null,
    aiValidationStatus:
      (row.ai_validation_status as ClusterRecord["aiValidationStatus"] | null) ??
      (row.aiValidationStatus as ClusterRecord["aiValidationStatus"] | null) ??
      "unavailable",
    effectiveVisualSeverity:
      (row.effective_visual_severity as ClusterRecord["effectiveVisualSeverity"] | null) ??
      (row.effectiveVisualSeverity as ClusterRecord["effectiveVisualSeverity"] | null) ??
      null,
    moderatorReviewStatus:
      (row.moderator_review_status as ClusterRecord["moderatorReviewStatus"] | null) ??
      (row.moderatorReviewStatus as ClusterRecord["moderatorReviewStatus"] | null) ??
      "pending",
    createdAt: String(row.created_at ?? row.createdAt),
    updatedAt: String(row.updated_at ?? row.updatedAt),
  };
}

function mapReportRow(row: UserProfileRowLike): ReportRecord {
  return {
    id: String(row.id),
    clusterId: String(row.cluster_id ?? row.clusterId),
    userCategory: row.user_category as ReportCategory,
    description: String(row.description ?? ""),
    photoUrl: String(row.photo_url ?? row.photoUrl),
    lat: Number(row.lat),
    lng: Number(row.lng),
    address: (row.address as string | null) ?? null,
    district: (row.district as string | null) ?? null,
    severity: Number(row.severity ?? 0),
    priorityScore: Number(row.ai_priority_score ?? row.priorityScore ?? 0),
    priorityReason:
      (row.ai_priority_reason as string | null) ??
      (row.priorityReason as string | null) ??
      null,
    topFactors: Array.isArray(row.ai_top_factors)
      ? (row.ai_top_factors as PriorityFactor[])
      : Array.isArray(row.topFactors)
        ? (row.topFactors as PriorityFactor[])
        : [],
    reviewStatus:
      (row.review_status as ReportRecord["reviewStatus"] | null) ??
      (row.reviewStatus as ReportRecord["reviewStatus"] | null) ??
      "pending",
    aiCorrect:
      typeof row.ai_correct === "boolean"
        ? (row.ai_correct as boolean)
        : typeof row.aiCorrect === "boolean"
          ? (row.aiCorrect as boolean)
          : null,
    expertCategory:
      (row.expert_category as ReportCategory | null) ??
      (row.expertCategory as ReportCategory | null) ??
      null,
    expertVisualSeverity:
      (row.expert_visual_severity as ReportRecord["expertVisualSeverity"] | null) ??
      (row.expertVisualSeverity as ReportRecord["expertVisualSeverity"] | null) ??
      null,
    reviewNote:
      (row.review_note as string | null) ?? (row.reviewNote as string | null) ?? null,
    reviewedBy:
      (row.reviewed_by as string | null) ?? (row.reviewedBy as string | null) ?? null,
    reviewedAt:
      (row.reviewed_at as string | null) ?? (row.reviewedAt as string | null) ?? null,
    status: row.status as ClusterStatus,
    aiCategory: (row.ai_category as ReportCategory | null) ?? null,
    aiConfidence:
      row.ai_confidence === null || row.ai_confidence === undefined
        ? null
        : Number(row.ai_confidence),
    aiTags: Array.isArray(row.ai_tags) ? (row.ai_tags as string[]) : [],
    aiValidationStatus:
      (row.ai_validation_status as ReportRecord["aiValidationStatus"]) ??
      "unavailable",
    aiNeedsReview: Boolean(row.ai_needs_review),
    aiReason: (row.ai_reason as string | null) ?? null,
    aiVisualSeverity:
      (row.ai_visual_severity as AiVisualSeverity | null) ??
      (row.aiVisualSeverity as AiVisualSeverity | null) ??
      null,
    aiDeepAnalysis:
      (row.ai_deep_analysis as ReportDeepAnalysis | null) ??
      (row.aiDeepAnalysis as ReportDeepAnalysis | null) ??
      null,
    aiDeepAnalyzedAt:
      (row.ai_deep_analyzed_at as string | null) ??
      (row.aiDeepAnalyzedAt as string | null) ??
      null,
    aiRaw: (row.ai_raw as Record<string, unknown> | null) ?? null,
    humanRealVotes: Number(row.human_real_votes ?? row.humanRealVotes ?? 0),
    humanFakeVotes: Number(row.human_fake_votes ?? row.humanFakeVotes ?? 0),
    humanVotesTotal: Number(row.human_votes_total ?? row.humanVotesTotal ?? 0),
    humanConfirmationStatus:
      (row.human_confirmation_status as ReportRecord["humanConfirmationStatus"] | null) ??
      (row.humanConfirmationStatus as ReportRecord["humanConfirmationStatus"] | null) ??
      "pending",
    humanLastVotedAt:
      (row.human_last_voted_at as string | null) ??
      (row.humanLastVotedAt as string | null) ??
      null,
    submittedBy: (row.submitted_by as string | null) ?? (row.submittedBy as string | null) ?? null,
    createdAt: String(row.created_at ?? row.createdAt),
    updatedAt: String(row.updated_at ?? row.updatedAt),
  };
}

function mapHistoryRow(row: UserProfileRowLike): StatusHistoryRecord {
  return {
    id: String(row.id),
    clusterId: String(row.cluster_id ?? row.clusterId),
    oldStatus: (row.old_status as ClusterStatus | null) ?? (row.oldStatus as ClusterStatus | null),
    newStatus: row.new_status as ClusterStatus,
    changedBy: (row.changed_by as string | null) ?? (row.changedBy as string | null) ?? null,
    changedAt: String(row.changed_at ?? row.changedAt),
  };
}
