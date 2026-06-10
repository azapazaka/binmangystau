// src/lib/api.ts
import { supabase } from './supabase'
import type { ClusterRecord, ReportRecord, DashboardStats } from '@/types'

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
  userCategory: string
  description: string
  lat: number
  lng: number
  address: string
  submittedBy: string
}): Promise<void> {
  // Upload photo
  const ext = input.photo.name.split('.').pop()
  const path = `${Date.now()}-${crypto.randomUUID()}.${ext}`
  const { error: uploadError } = await supabase.storage
    .from('reports')
    .upload(path, input.photo, { contentType: input.photo.type })
  if (uploadError) throw uploadError

  const { data: urlData } = supabase.storage.from('reports').getPublicUrl(path)

  const { error } = await supabase.from('reports').insert({
    user_category: input.userCategory,
    description: input.description,
    photo_url: urlData.publicUrl,
    lat: input.lat,
    lng: input.lng,
    address: input.address,
    submitted_by: input.submittedBy,
    status: 'open',
    ai_validation_status: 'unavailable',
    ai_needs_review: false,
    ai_tags: [],
    ai_priority_score: 0,
    ai_top_factors: [],
    review_status: 'pending',
    human_real_votes: 0,
    human_fake_votes: 0,
    human_votes_total: 0,
    human_confirmation_status: 'pending',
    severity: 0,
  })
  if (error) throw error
}

export async function castHumanVote(
  reportId: string, userId: string, verdict: 'real' | 'fake'
) {
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
