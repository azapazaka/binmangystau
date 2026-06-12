export type ReportCategory = "road" | "light" | "trash" | "traffic" | "other";
export type AccountRole = "citizen" | "admin";
export type LocationSource = "manual" | "geolocation" | "map";
export type CityPulseMode = "live" | "simulation";
export type SmartBinWasteType = "plastic" | "metal" | "mixed" | "organic";
export type SmartBinStatus =
  | "normal"
  | "warning"
  | "full"
  | "fire"
  | "sos"
  | "offline";
export type SmartBinSource = "device" | "simulation";
export type SmartBinRuntimeSource = "legacy" | "bridge" | "cloud";
export type SmartBinSerialFormat = "json" | "sensor_log";
export type CityPulseDemoAction = "fill_up" | "fire" | "sos" | "reset";
export type SmartBinSectionKey = "plastic" | "organic";

export type ClusterStatus = "open" | "in_progress" | "closed";

export type AiValidationStatus =
  | "valid"
  | "invalid"
  | "uncertain"
  | "unavailable";

export type AiVisualSeverity = "low" | "medium" | "high";

export type PriorityFactorKey =
  | "category"
  | "visual_severity"
  | "ai_confidence"
  | "cluster_volume"
  | "nearby_density"
  | "recency"
  | "zone"
  | "validation"
  | "description";

export type PriorityFactor = {
  key: PriorityFactorKey;
  label: string;
  impact: number;
  value: string;
};

export type ReviewStatus = "pending" | "confirmed" | "corrected" | "invalidated";
export type ReviewVerdict = "confirmed" | "corrected" | "invalidated";
export type HumanVoteVerdict = "real" | "fake";
export type HumanConfirmationStatus =
  | "pending"
  | "confirmed_real"
  | "confirmed_fake"
  | "disputed";

export type ReviewReportInput = {
  verdict: ReviewVerdict;
  correctedCategory?: ReportCategory | null;
  correctedVisualSeverity?: AiVisualSeverity | null;
  note?: string;
  reviewedBy: string;
};

export type ReportDeepAnalysis = {
  summary: string;
  observedIssue: string;
  visualSeverity: AiVisualSeverity;
  urgency: string;
  safetyRisk: string;
  recommendedAction: string;
  evidence: string[];
};

export type ClusterRecord = {
  id: string;
  category: ReportCategory;
  effectiveCategory: ReportCategory;
  lat: number;
  lng: number;
  address: string | null;
  district: string | null;
  zoneCoefficient: number;
  reportCount: number;
  severity: number;
  priorityScore: number;
  priorityReason: string | null;
  topFactors: PriorityFactor[];
  prioritySourceReportId: string | null;
  status: ClusterStatus;
  representativePhotoUrl: string | null;
  aiValidationStatus: AiValidationStatus;
  effectiveVisualSeverity: AiVisualSeverity | null;
  moderatorReviewStatus: ReviewStatus;
  createdAt: string;
  updatedAt: string;
};

export type ReportRecord = {
  id: string;
  clusterId: string | null;
  userCategory: ReportCategory;
  description: string;
  photoUrl: string;
  lat: number;
  lng: number;
  address: string | null;
  district: string | null;
  severity: number;
  priorityScore: number;
  priorityReason: string | null;
  topFactors: PriorityFactor[];
  reviewStatus: ReviewStatus;
  aiCorrect: boolean | null;
  expertCategory: ReportCategory | null;
  expertVisualSeverity: AiVisualSeverity | null;
  reviewNote: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  status: ClusterStatus;
  aiCategory: ReportCategory | null;
  aiConfidence: number | null;
  aiTags: string[];
  aiValidationStatus: AiValidationStatus;
  aiNeedsReview: boolean;
  aiReason: string | null;
  aiVisualSeverity: AiVisualSeverity | null;
  aiDeepAnalysis: ReportDeepAnalysis | null;
  aiDeepAnalyzedAt: string | null;
  aiRaw: Record<string, unknown> | null;
  humanRealVotes: number;
  humanFakeVotes: number;
  humanVotesTotal: number;
  humanConfirmationStatus: HumanConfirmationStatus;
  humanLastVotedAt: string | null;
  submittedBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type StatusHistoryRecord = {
  id: string;
  clusterId: string;
  oldStatus: ClusterStatus | null;
  newStatus: ClusterStatus;
  changedBy: string | null;
  changedAt: string;
};

export type AiProviderResult = {
  isValidReport: boolean;
  suggestedCategory?: ReportCategory;
  confidence: number;
  tags: string[];
  reason: string;
  visualSeverity?: AiVisualSeverity;
};

export type NormalizedAiClassification = {
  aiCategory: ReportCategory | null;
  aiConfidence: number | null;
  aiTags: string[];
  aiValidationStatus: AiValidationStatus;
  aiNeedsReview: boolean;
  aiReason: string | null;
  aiVisualSeverity: AiVisualSeverity | null;
};

export type DashboardStats = {
  totalReports: number;
  weeklyReports: number;
  inProgress: number;
  resolved: number;
  reviewedReports: number;
  aiCorrectReports: number;
  correctedReports: number;
  aiAgreementRate: number;
};

export type CitizenSummary = {
  totalReports: number;
  resolvedReports: number;
  activityScore: number;
  currentRank: number | null;
};

export type CitizenLeaderboardEntry = {
  citizenId: string;
  totalReports: number;
  resolvedReports: number;
  activityScore: number;
  rank: number;
};

export type NewReportInput = {
  category: ReportCategory;
  description?: string;
  photo: File;
  lat?: number;
  lng?: number;
  manualAddress?: string;
  addressLabel?: string;
  locationSource?: LocationSource;
  submittedBy?: string | null;
};

export type BaseUserProfile = {
  displayName: string;
  district: string;
  bio: string;
  avatarUrl: string | null;
  hasStoredProfile: boolean;
};

export type CitizenProfile = BaseUserProfile & {
  role: "citizen";
};

export type AdminProfile = BaseUserProfile & {
  role: "admin";
  position: string;
  department: string;
  categories: ReportCategory[];
};

export type UserProfile = CitizenProfile | AdminProfile;

export type SaveCitizenProfileInput = {
  displayName: string;
  district: string;
  bio: string;
  avatarUrl: string | null;
};

export type SaveAdminProfileInput = SaveCitizenProfileInput & {
  position: string;
  department: string;
  categories: ReportCategory[];
};

export type SaveUserProfileInput = SaveCitizenProfileInput | SaveAdminProfileInput;

export type SmartBinRecord = {
  id: string;
  label: string;
  district: string;
  lat: number;
  lng: number;
  wasteType: SmartBinWasteType;
  fillLevel: number;
  temperature: number;
  status: SmartBinStatus;
  lastSeen: string;
  source: SmartBinSource;
};

export type SmartBinBridgeSectionPayload = {
  distanceCm: number | null;
  fillLevel: number | null;
  status: SmartBinStatus;
  isOffline: boolean;
  lastReadAt: string | null;
};

export type SmartBinBridgeSections = Record<
  SmartBinSectionKey,
  SmartBinBridgeSectionPayload
>;

export type SmartBinBridgeResponse = {
  ok: boolean;
  readAt: string | null;
  sections: SmartBinBridgeSections;
  error?: string | null;
  lastParsedFormat?: SmartBinSerialFormat | null;
};

export type SmartBinPosition = {
  lat: number;
  lng: number;
  source: "browser" | "stored" | "default";
};

export type SmartBinLiveSection = {
  wasteType: SmartBinSectionKey;
  distanceCm: number | null;
  fillLevel: number | null;
  status: SmartBinStatus;
  isOffline: boolean;
  lastReadAt: string | null;
};

export type SmartBinLiveRecord = {
  id: string;
  label: string;
  lat: number;
  lng: number;
  locationSource: SmartBinPosition["source"];
  locationLabel: string;
  sections: Record<SmartBinSectionKey, SmartBinLiveSection>;
  lastUpdatedAt: string | null;
};

export type SmartBinPriority = {
  binId: string;
  label: string;
  district: string;
  wasteType: SmartBinWasteType;
  fillLevel: number;
  status: SmartBinStatus;
  lastSeen: string;
  reason: string;
};

export type CityPulseRoutePlan = {
  summary: string;
  stops: string[];
};

export type CityPulseKpi = {
  label: string;
  value: string;
  note: string;
};

export type CityPulseChartDatum = {
  label: string;
  value: number;
};

export type CityPulseTrendPoint = {
  label: string;
  value: number;
};

export type CityPulseAnalytics = {
  kpis: CityPulseKpi[];
  priorities: SmartBinPriority[];
  routePlan: CityPulseRoutePlan;
  wasteBreakdown: CityPulseChartDatum[];
  districtLoad: CityPulseChartDatum[];
  incidentTrend: CityPulseTrendPoint[];
};
