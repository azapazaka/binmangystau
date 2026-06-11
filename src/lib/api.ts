// src/lib/api.ts
import { supabase } from './supabase'
import { analyzeReportImage, normalizeAiResult } from './ai'
import { env } from './env'
import type { ClusterRecord, ReportRecord, DashboardStats, ReportCategory } from '@/types'

const SESSION_EXPIRED_MESSAGE = 'Сессия истекла. Войдите снова и отправьте обращение повторно.'

async function requireAuthenticatedUser(expectedUserId?: string) {
  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) {
    throw new Error(SESSION_EXPIRED_MESSAGE)
  }

  if (expectedUserId && data.user.id !== expectedUserId) {
    throw new Error(SESSION_EXPIRED_MESSAGE)
  }

  return data.user
}

// ── Clusters ──────────────────────────────────────────────────────────────
export async function listClusters(filters?: {
  category?: string
}): Promise<ClusterRecord[]> {
  let q = supabase
    .from('clusters')
    .select('*')
    .order('priority_score', { ascending: false })

  if (filters?.category && filters.category !== 'all')
    q = q.eq('category', filters.category)

  const { data, error } = await q
  if (error) throw error
  return (data ?? []).map(mapCluster)
}

export async function updateClusterStatus(
  clusterId: string,
  status: 'open' | 'in_progress' | 'closed'
) {
  await requireAuthenticatedUser()

  const { error } = await supabase
    .from('clusters')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', clusterId)
  if (error) throw error
}

// ── Reports ───────────────────────────────────────────────────────────────
export async function listReports(filters?: { clusterId?: string; submittedBy?: string }): Promise<ReportRecord[]> {
  let q = supabase.from('reports').select('*').order('created_at', { ascending: false })
  if (filters?.clusterId) q = q.eq('cluster_id', filters.clusterId)
  if (filters?.submittedBy) q = q.eq('submitted_by', filters.submittedBy)
  const { data, error } = await q
  if (error) throw error
  return (data ?? []).map(mapReport)
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [total, inProg, resolved] = await Promise.all([
    supabase.from('reports').select('id', { count: 'exact', head: true }),
    supabase.from('clusters').select('id', { count: 'exact', head: true }).eq('status', 'in_progress'),
    supabase.from('clusters').select('id', { count: 'exact', head: true }).eq('status', 'closed'),
  ])
  if (total.error) throw total.error
  if (inProg.error) throw inProg.error
  if (resolved.error) throw resolved.error
  return {
    totalReports: total.count ?? 0,
    weeklyReports: 0,
    inProgress: inProg.count ?? 0,
    resolved: resolved.count ?? 0,
    reviewedReports: 0,
    aiCorrectReports: 0,
    correctedReports: 0,
    aiAgreementRate: 0,
  }
}

export async function createReport(input: {
  photo: File
  userCategory: ReportCategory
  description: string
  lat: number
  lng: number
  address: string
  submittedBy: string
}): Promise<void> {
  await requireAuthenticatedUser(input.submittedBy)

  // Upload photo
  const ext = input.photo.name.split('.').pop()
  const path = `${Date.now()}-${crypto.randomUUID()}.${ext}`
  const { error: uploadError } = await supabase.storage
    .from('reports')
    .upload(path, input.photo, { contentType: input.photo.type })
  if (uploadError) throw uploadError

  const { data: urlData } = supabase.storage.from('reports').getPublicUrl(path)

  const aiResult = await analyzeReportImage(
    urlData.publicUrl,
    input.userCategory,
    input.description,
  )
  const ai = normalizeAiResult(aiResult)

  const { data: insertedReports, error } = await supabase.from('reports').insert({
    user_category: input.userCategory,
    description: input.description,
    photo_url: urlData.publicUrl,
    lat: input.lat,
    lng: input.lng,
    address: input.address,
    submitted_by: input.submittedBy,
    status: 'open',
    ai_validation_status: ai.ai_validation_status,
    ai_needs_review: ai.ai_needs_review,
    ai_category: ai.ai_category,
    ai_confidence: ai.ai_confidence,
    ai_tags: ai.ai_tags,
    ai_reason: ai.ai_reason,
    ai_visual_severity: ai.ai_visual_severity,
    ai_priority_score: 0,
    ai_top_factors: [],
    review_status: 'pending',
    human_real_votes: 0,
    human_fake_votes: 0,
    human_votes_total: 0,
    human_confirmation_status: 'pending',
    severity: 0,
  }).select('*')
  if (error) throw error

  const inserted = insertedReports?.[0]
  if (!inserted) return

  const report = mapReport(inserted as Record<string, unknown>)
  const clusterSync = await syncClusterForReport({
    reportId: report.id,
    photoUrl: report.photoUrl,
    lat: input.lat,
    lng: input.lng,
    address: input.address,
    district: report.district,
    userCategory: input.userCategory,
    aiCategory: report.aiCategory,
    aiConfidence: report.aiConfidence,
    aiReason: report.aiReason,
    aiValidationStatus: report.aiValidationStatus,
    aiVisualSeverity: report.aiVisualSeverity,
  })

  const { error: reportUpdateError } = await supabase
    .from('reports')
    .update({
      cluster_id: clusterSync.clusterId,
      ai_priority_score: clusterSync.priorityScore,
      ai_priority_reason: clusterSync.priorityReason,
      ai_top_factors: clusterSync.topFactors,
      status: clusterSync.status,
    })
    .eq('id', report.id)

  if (reportUpdateError) throw reportUpdateError
}

export async function reviewReport(
  reportId: string,
  input: {
    verdict: 'confirmed' | 'corrected' | 'invalidated'
    correctedCategory?: string | null
    correctedVisualSeverity?: string | null
    note?: string
    reviewedBy: string
  }
): Promise<void> {
  await requireAuthenticatedUser(input.reviewedBy)

  const { error } = await supabase
    .from('reports')
    .update({
      review_status: input.verdict,
      ai_correct: input.verdict === 'confirmed',
      expert_category: input.correctedCategory ?? null,
      expert_visual_severity: input.correctedVisualSeverity ?? null,
      review_note: input.note ?? null,
      reviewed_by: input.reviewedBy,
      reviewed_at: new Date().toISOString(),
      ai_needs_review: false,
    })
    .eq('id', reportId)
  if (error) throw error
}

export async function castHumanVote(
  reportId: string, userId: string, verdict: 'real' | 'fake'
) {
  await requireAuthenticatedUser(userId)

  const { error } = await supabase.from('report_human_votes').upsert(
    { report_id: reportId, user_id: userId, verdict },
    { onConflict: 'report_id,user_id' }
  )
  if (error) throw error
}

export async function getVerifyQueue(userId: string): Promise<ReportRecord[]> {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('ai_needs_review', true)
    .neq('submitted_by', userId)
    .order('created_at', { ascending: false })
    .limit(8)
  if (error) throw error
  return (data ?? []).map(mapReport)
}

// ── Row mappers ───────────────────────────────────────────────────────────
function mapCluster(row: Record<string, unknown>): ClusterRecord {
  return {
    id: row.id as string,
    category: row.category as ClusterRecord['category'],
    effectiveCategory: (row.effective_category ?? row.category) as ClusterRecord['category'],
    lat: row.lat as number,
    lng: row.lng as number,
    address: row.address as string | null,
    district: row.district as string | null,
    zoneCoefficient: (row.zone_coefficient as number) ?? 1,
    reportCount: (row.report_count as number) ?? 1,
    severity: (row.severity as number) ?? 0,
    priorityScore: (row.priority_score as number) ?? 0,
    priorityReason: row.priority_reason as string | null,
    topFactors: (row.top_factors as ClusterRecord['topFactors']) ?? [],
    prioritySourceReportId: row.priority_source_report_id as string | null,
    status: row.status as ClusterRecord['status'],
    representativePhotoUrl: row.representative_photo_url as string | null,
    aiValidationStatus: row.ai_validation_status as ClusterRecord['aiValidationStatus'],
    effectiveVisualSeverity: row.effective_visual_severity as ClusterRecord['effectiveVisualSeverity'],
    moderatorReviewStatus: (row.moderator_review_status ?? 'pending') as ClusterRecord['moderatorReviewStatus'],
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

function mapReport(row: Record<string, unknown>): ReportRecord {
  return {
    id: row.id as string,
    clusterId: (row.cluster_id ?? null) as string | null,
    userCategory: row.user_category as ReportRecord['userCategory'],
    description: (row.description as string) ?? '',
    photoUrl: row.photo_url as string,
    lat: row.lat as number,
    lng: row.lng as number,
    address: row.address as string | null,
    district: row.district as string | null,
    severity: (row.severity as number) ?? 0,
    priorityScore: (row.ai_priority_score as number) ?? 0,
    priorityReason: row.ai_priority_reason as string | null,
    topFactors: (row.ai_top_factors as ReportRecord['topFactors']) ?? [],
    status: row.status as ReportRecord['status'],
    aiCategory: row.ai_category as ReportRecord['aiCategory'],
    aiConfidence: row.ai_confidence as number | null,
    aiTags: (row.ai_tags as string[]) ?? [],
    aiValidationStatus: row.ai_validation_status as ReportRecord['aiValidationStatus'],
    aiNeedsReview: (row.ai_needs_review as boolean) ?? false,
    aiReason: row.ai_reason as string | null,
    aiVisualSeverity: row.ai_visual_severity as ReportRecord['aiVisualSeverity'],
    aiDeepAnalysis: row.ai_deep_analysis as ReportRecord['aiDeepAnalysis'],
    aiDeepAnalyzedAt: row.ai_deep_analyzed_at as string | null,
    aiRaw: row.ai_raw as Record<string, unknown> | null,
    reviewStatus: row.review_status as ReportRecord['reviewStatus'],
    aiCorrect: row.ai_correct as boolean | null,
    expertCategory: row.expert_category as ReportRecord['expertCategory'],
    expertVisualSeverity: row.expert_visual_severity as ReportRecord['expertVisualSeverity'],
    reviewNote: row.review_note as string | null,
    reviewedBy: row.reviewed_by as string | null,
    reviewedAt: row.reviewed_at as string | null,
    humanRealVotes: (row.human_real_votes as number) ?? 0,
    humanFakeVotes: (row.human_fake_votes as number) ?? 0,
    humanVotesTotal: (row.human_votes_total as number) ?? 0,
    humanConfirmationStatus: row.human_confirmation_status as ReportRecord['humanConfirmationStatus'],
    humanLastVotedAt: row.human_last_voted_at as string | null,
    submittedBy: row.submitted_by as string | null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  }
}

type ClusterSyncInput = {
  reportId: string
  photoUrl: string
  lat: number
  lng: number
  address: string
  district: string | null
  userCategory: ReportCategory
  aiCategory: ReportCategory | null
  aiConfidence: number | null
  aiReason: string | null
  aiValidationStatus: ReportRecord['aiValidationStatus']
  aiVisualSeverity: ReportRecord['aiVisualSeverity']
}

function toRadians(value: number) {
  return (value * Math.PI) / 180
}

function distanceMeters(from: { lat: number; lng: number }, to: { lat: number; lng: number }) {
  const earthRadius = 6371000
  const dLat = toRadians(to.lat - from.lat)
  const dLng = toRadians(to.lng - from.lng)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(from.lat)) * Math.cos(toRadians(to.lat)) * Math.sin(dLng / 2) ** 2

  return 2 * earthRadius * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function severityWeight(severity: ReportRecord['aiVisualSeverity']) {
  if (severity === 'high') return 78
  if (severity === 'medium') return 52
  return 28
}

function buildPriorityFactors(input: {
  reportCount: number
  visualSeverity: ReportRecord['aiVisualSeverity']
  aiConfidence: number | null
  validationStatus: ReportRecord['aiValidationStatus']
  category: ReportCategory
}): ClusterRecord['topFactors'] {
  const confidencePercent = input.aiConfidence != null ? Math.round(input.aiConfidence * 100) : 0
  const factors: ClusterRecord['topFactors'] = [
    {
      key: 'visual_severity',
      label: 'Визуальная серьёзность',
      impact: severityWeight(input.visualSeverity),
      value:
        input.visualSeverity === 'high'
          ? 'Высокая'
          : input.visualSeverity === 'medium'
            ? 'Средняя'
            : 'Низкая',
    },
    {
      key: 'cluster_volume',
      label: 'Объём кластера',
      impact: Math.min(18, input.reportCount * 4),
      value: `${input.reportCount} заявок`,
    },
    {
      key: 'ai_confidence',
      label: 'Уверенность AI',
      impact: Math.min(12, Math.round(confidencePercent / 10)),
      value: input.aiConfidence != null ? `${confidencePercent}%` : 'Нет данных',
    },
    {
      key: 'validation',
      label: 'Статус проверки',
      impact: input.validationStatus === 'valid' ? 6 : input.validationStatus === 'uncertain' ? 3 : 0,
      value:
        input.validationStatus === 'valid'
          ? 'Подтверждено AI'
          : input.validationStatus === 'uncertain'
            ? 'Нужна проверка'
            : 'Недоступно',
    },
    {
      key: 'category',
      label: 'Категория',
      impact: input.category === 'trash' ? 4 : 2,
      value: input.category,
    },
  ]

  return factors.sort((left, right) => right.impact - left.impact)
}

function buildPrioritySummary(input: {
  reportCount: number
  visualSeverity: ReportRecord['aiVisualSeverity']
  aiReason: string | null
}) {
  if (input.aiReason) return input.aiReason
  if (input.visualSeverity === 'high') return 'Высокий риск по визуальным признакам'
  if (input.reportCount > 1) return `Повторяющийся сигнал: ${input.reportCount} заявок`
  return 'Новая точка требует проверки'
}

function buildPriorityScore(input: {
  reportCount: number
  visualSeverity: ReportRecord['aiVisualSeverity']
  aiConfidence: number | null
  validationStatus: ReportRecord['aiValidationStatus']
}) {
  const base = severityWeight(input.visualSeverity)
  const countBoost = Math.min(15, Math.max(0, input.reportCount - 1) * 5)
  const confidenceBoost = input.aiConfidence != null ? Math.round(input.aiConfidence * 10) : 0
  const validationBoost = input.validationStatus === 'valid' ? 5 : input.validationStatus === 'uncertain' ? 2 : 0

  return Math.min(100, base + countBoost + confidenceBoost + validationBoost)
}

async function syncClusterForReport(input: ClusterSyncInput) {
  const effectiveCategory = input.aiCategory ?? input.userCategory
  const effectiveVisualSeverity = input.aiVisualSeverity ?? 'low'

  const existingClusters = await listClusters({ category: effectiveCategory })
  const nearbyCluster = existingClusters.find(
    (cluster) =>
      distanceMeters(
        { lat: input.lat, lng: input.lng },
        { lat: cluster.lat, lng: cluster.lng },
      ) <= env.clusterRadiusMeters,
  )

  const nextReportCount = (nearbyCluster?.reportCount ?? 0) + 1
  const topFactors = buildPriorityFactors({
    reportCount: nextReportCount,
    visualSeverity: effectiveVisualSeverity,
    aiConfidence: input.aiConfidence,
    validationStatus: input.aiValidationStatus,
    category: effectiveCategory,
  })
  const priorityScore = buildPriorityScore({
    reportCount: nextReportCount,
    visualSeverity: effectiveVisualSeverity,
    aiConfidence: input.aiConfidence,
    validationStatus: input.aiValidationStatus,
  })
  const priorityReason = buildPrioritySummary({
    reportCount: nextReportCount,
    visualSeverity: effectiveVisualSeverity,
    aiReason: input.aiReason,
  })
  const status: ClusterRecord['status'] = priorityScore >= 66 ? 'in_progress' : 'open'

  if (nearbyCluster) {
    const { error } = await supabase
      .from('clusters')
      .update({
        report_count: nextReportCount,
        address: nearbyCluster.address ?? input.address,
        district: nearbyCluster.district ?? input.district,
        severity: Math.max(nearbyCluster.severity, severityWeight(effectiveVisualSeverity)),
        priority_score: priorityScore,
        priority_reason: priorityReason,
        top_factors: topFactors,
        priority_source_report_id: input.reportId,
        representative_photo_url: input.photoUrl,
        ai_validation_status: input.aiValidationStatus,
        effective_category: effectiveCategory,
        effective_visual_severity: effectiveVisualSeverity,
        moderator_review_status: 'pending',
        status: nearbyCluster.status === 'closed' ? 'open' : status,
      })
      .eq('id', nearbyCluster.id)

    if (error) throw error

    return {
      clusterId: nearbyCluster.id,
      priorityScore,
      priorityReason,
      topFactors,
      status: nearbyCluster.status === 'closed' ? 'open' : status,
    }
  }

  const { data: insertedClusters, error } = await supabase
    .from('clusters')
    .insert({
      category: effectiveCategory,
      effective_category: effectiveCategory,
      lat: input.lat,
      lng: input.lng,
      address: input.address,
      district: input.district,
      zone_coefficient: 1,
      report_count: 1,
      severity: severityWeight(effectiveVisualSeverity),
      status,
      representative_photo_url: input.photoUrl,
      priority_score: priorityScore,
      priority_reason: priorityReason,
      top_factors: topFactors,
      priority_source_report_id: input.reportId,
      ai_validation_status: input.aiValidationStatus,
      effective_visual_severity: effectiveVisualSeverity,
      moderator_review_status: 'pending',
    })
    .select('id')

  if (error) throw error

  return {
    clusterId: insertedClusters?.[0]?.id as string,
    priorityScore,
    priorityReason,
    topFactors,
    status,
  }
}
