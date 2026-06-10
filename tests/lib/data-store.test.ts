import { beforeEach, describe, expect, it, vi } from "vitest";

const createSupabaseAdminClientMock = vi.fn();
const reverseGeocodeMock = vi.fn();
const forwardGeocodeMock = vi.fn();
const classifyReportImageMock = vi.fn();
const analyzeReportWithProviderMock = vi.fn();

vi.mock("@/lib/env", () => ({
  env: {
    supabaseStorageBucket: "reports",
  },
  assertSupabaseConfigured: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  createSupabaseAdminClient: createSupabaseAdminClientMock,
}));

vi.mock("@/lib/geocoding", () => ({
  reverseGeocode: reverseGeocodeMock,
  forwardGeocode: forwardGeocodeMock,
}));

vi.mock("@/lib/ai/classify-report-image", () => ({
  classifyReportImage: classifyReportImageMock,
}));

vi.mock("@/lib/ai/provider", () => ({
  analyzeReportWithProvider: analyzeReportWithProviderMock,
}));

type Row = Record<string, unknown>;
type TableName = "clusters" | "reports" | "status_history" | "report_human_votes";

function createPhotoFile(name = "report.jpg", type = "image/jpeg") {
  const bytes = new TextEncoder().encode("demo-image");

  return {
    arrayBuffer: async () => bytes.buffer.slice(0),
    name,
    size: bytes.byteLength,
    type,
  } as File;
}

function createFakeAdminClient(seed?: Partial<Record<TableName, Row[]>>) {
  const tables: Record<TableName, Row[]> = {
    clusters: seed?.clusters ? [...seed.clusters] : [],
    reports: seed?.reports ? [...seed.reports] : [],
    status_history: seed?.status_history ? [...seed.status_history] : [],
    report_human_votes: seed?.report_human_votes ? [...seed.report_human_votes] : [],
  };

  class Query {
    private filters: Array<(row: Row) => boolean> = [];
    private insertedRows: Row[] | null = null;
    private updateValues: Row | null = null;
    private selectHead = false;
    private countMode = false;
    private singleRow = false;
    private orders: Array<{ field: string; ascending: boolean }> = [];

    constructor(private readonly table: TableName) {}

    select(columns = "*", options?: { head?: boolean; count?: "exact" }) {
      void columns;
      this.selectHead = Boolean(options?.head);
      this.countMode = options?.count === "exact";
      return this;
    }

    insert(payload: Row | Row[]) {
      const rows = Array.isArray(payload) ? payload : [payload];
      this.insertedRows = rows.map((row) => normalizeInsertedRow(this.table, row));
      tables[this.table].push(...this.insertedRows);
      return this;
    }

    upsert(payload: Row | Row[], options?: { onConflict?: string }) {
      const rows = Array.isArray(payload) ? payload : [payload];
      const conflictFields = (options?.onConflict ?? "")
        .split(",")
        .map((field) => field.trim())
        .filter(Boolean);

      this.insertedRows = rows.map((row) => {
        const normalized = normalizeInsertedRow(this.table, row);
        const existingRow =
          conflictFields.length > 0
            ? tables[this.table].find((candidate) =>
                conflictFields.every((field) => candidate[field] === normalized[field]),
              )
            : null;

        if (existingRow) {
          Object.assign(existingRow, {
            ...normalized,
            created_at: existingRow["created_at"] ?? normalized["created_at"],
          });
          return existingRow;
        }

        tables[this.table].push(normalized);
        return normalized;
      });

      return this;
    }

    update(values: Row) {
      this.updateValues = values;
      return this;
    }

    eq(field: string, value: unknown) {
      this.filters.push((row) => row[field] === value);
      return this;
    }

    gte(field: string, value: unknown) {
      this.filters.push((row) => String(row[field] ?? "") >= String(value ?? ""));
      return this;
    }

    order(field: string, options?: { ascending?: boolean }) {
      this.orders.push({ field, ascending: options?.ascending ?? true });
      return this;
    }

    single() {
      this.singleRow = true;
      return this;
    }

    then<TResult1 = unknown, TResult2 = never>(
      onfulfilled?: ((value: unknown) => TResult1 | PromiseLike<TResult1>) | null,
      onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
    ) {
      return Promise.resolve(this.execute()).then(onfulfilled, onrejected);
    }

    private execute() {
      if (this.updateValues) {
        let updatedRows = tables[this.table].filter((row) => this.filters.every((filter) => filter(row)));
        updatedRows = updatedRows.map((row) => Object.assign(row, this.updateValues));

        return {
          data: this.singleRow ? updatedRows[0] ?? null : updatedRows,
          error: null,
          count: this.countMode ? updatedRows.length : null,
        };
      }

      if (this.insertedRows) {
        const data = this.singleRow ? this.insertedRows[0] ?? null : this.insertedRows;
        return { data, error: null, count: this.countMode ? this.insertedRows.length : null };
      }

      let rows = tables[this.table].filter((row) => this.filters.every((filter) => filter(row)));
      rows = [...rows];

      for (const order of [...this.orders].reverse()) {
        rows.sort((left, right) => {
          const leftValue = left[order.field];
          const rightValue = right[order.field];

          if (leftValue === rightValue) {
            return 0;
          }

          if (leftValue === undefined || leftValue === null) {
            return order.ascending ? -1 : 1;
          }

          if (rightValue === undefined || rightValue === null) {
            return order.ascending ? 1 : -1;
          }

          if (leftValue > rightValue) {
            return order.ascending ? 1 : -1;
          }

          return order.ascending ? -1 : 1;
        });
      }

      return {
        data: this.selectHead ? null : this.singleRow ? rows[0] ?? null : rows,
        error: null,
        count: this.countMode ? rows.length : null,
      };
    }
  }

  const storageUploadMock = vi.fn(async (path: string) => ({
    data: { path },
    error: null,
  }));

  return {
    from(table: TableName) {
      return new Query(table);
    },
    storage: {
      from(bucket: string) {
        void bucket;
        return {
          upload: storageUploadMock,
          getPublicUrl(path: string) {
            return {
              data: {
                publicUrl: `https://cdn.citypulse.test/${path}`,
              },
            };
          },
        };
      },
    },
    tables,
    storageUploadMock,
  };
}

function normalizeInsertedRow(table: TableName, row: Row): Row {
  const now = "2026-04-05T09:00:00.000Z";

  if (table === "clusters") {
    return {
      id: row.id ?? "cluster-generated",
      status: "open",
      created_at: now,
      updated_at: now,
      ...row,
    } satisfies Row;
  }

  if (table === "reports") {
    return {
      id: row.id ?? "report-generated",
      human_real_votes: 0,
      human_fake_votes: 0,
      human_votes_total: 0,
      human_confirmation_status: "pending",
      human_last_voted_at: null,
      created_at: now,
      updated_at: now,
      ...row,
    } satisfies Row;
  }

  if (table === "report_human_votes") {
    return {
      id: row.id ?? crypto.randomUUID(),
      created_at: now,
      updated_at: now,
      ...row,
    } satisfies Row;
  }

  return {
    id: row.id ?? "history-generated",
    changed_at: now,
    ...row,
  } satisfies Row;
}

describe("data-store in Supabase-first mode", () => {
  beforeEach(() => {
    vi.resetModules();
    createSupabaseAdminClientMock.mockReset();
    reverseGeocodeMock.mockReset();
    forwardGeocodeMock.mockReset();
    classifyReportImageMock.mockReset();
    analyzeReportWithProviderMock.mockReset();

    forwardGeocodeMock.mockResolvedValue({
      lat: 43.238949,
      lng: 76.889709,
      address: "Абая 77",
      district: "Алмалинский",
      zoneKey: "almaly",
      zoneCoefficient: 1.2,
    });

    reverseGeocodeMock.mockResolvedValue({
      lat: 43.238949,
      lng: 76.889709,
      address: "Абая 77",
      district: "Алмалинский",
      zoneKey: "almaly",
      zoneCoefficient: 1.2,
    });

    classifyReportImageMock.mockResolvedValue({
      aiCategory: "trash",
      aiConfidence: 0.88,
      aiTags: ["yard"],
      aiValidationStatus: "valid",
      aiNeedsReview: false,
      aiReason: "Looks like an illegal dumping spot.",
      aiVisualSeverity: "medium",
    });

    analyzeReportWithProviderMock.mockResolvedValue({
      summary: "Deep analysis",
      observedIssue: "Observed issue",
      visualSeverity: "medium",
      urgency: "medium",
      safetyRisk: "moderate",
      recommendedAction: "Dispatch cleanup",
      evidence: ["overflowing waste"],
    });
  });

  it("creates a report, persists it in Supabase tables, and returns a mapped report record", async () => {
    const fakeAdmin = createFakeAdminClient();
    createSupabaseAdminClientMock.mockReturnValue(fakeAdmin);

    const { createReport, listReports, listClusters } = await import("@/lib/data-store");

    const createdReport = await createReport({
      category: "trash",
      description: "Illegal dumping near the yard",
      manualAddress: "Абая 77",
      photo: createPhotoFile(),
      submittedBy: "new-citizen@citypulse.local",
    });

    const reports = await listReports({ submittedBy: "new-citizen@citypulse.local" });
    const clusters = await listClusters({ period: "all" });

    expect(createdReport).not.toBeNull();
    expect(createdReport?.submittedBy).toBe("new-citizen@citypulse.local");
    expect(createdReport?.photoUrl).toContain("https://cdn.citypulse.test/reports/");
    expect(createdReport?.priorityScore).toBeGreaterThanOrEqual(0);
    expect(reports).toHaveLength(1);
    expect(clusters).toHaveLength(1);
    expect(fakeAdmin.tables.reports[0]?.submitted_by).toBe("new-citizen@citypulse.local");
    expect(fakeAdmin.storageUploadMock).toHaveBeenCalledTimes(1);
  });

  it("sanitizes storage object keys instead of using raw uploaded filenames", async () => {
    const fakeAdmin = createFakeAdminClient();
    createSupabaseAdminClientMock.mockReturnValue(fakeAdmin);

    const { createReport } = await import("@/lib/data-store");

    await createReport({
      category: "road",
      description: "Broken asphalt",
      manualAddress: "Абая 77",
      photo: createPhotoFile("Снимок экрана 2023-11-26 230647.png", "image/png"),
      submittedBy: "unicode-name@citypulse.local",
    });

    const uploadedPath = fakeAdmin.storageUploadMock.mock.calls[0]?.[0];

    expect(uploadedPath).toMatch(/^reports\/\d+-[a-f0-9-]+\.png$/);
    expect(uploadedPath).not.toContain("Снимок");
  });

  it("updates cluster status and persists status history in Supabase", async () => {
    const fakeAdmin = createFakeAdminClient({
      clusters: [
        {
          id: "cluster-1",
          category: "light",
          lat: 43.24,
          lng: 76.89,
          address: "Толе би 30",
          district: "Алмалинский",
          zone_coefficient: 1,
          report_count: 1,
          severity: 2,
          status: "open",
          representative_photo_url: "https://cdn.citypulse.test/report.jpg",
          ai_validation_status: "valid",
          priority_score: 10,
          priority_reason: "Initial priority",
          top_factors: [],
          priority_source_report_id: "report-1",
          effective_category: "light",
          effective_visual_severity: "medium",
          moderator_review_status: "pending",
          created_at: "2026-04-04T09:00:00.000Z",
          updated_at: "2026-04-04T09:00:00.000Z",
        },
      ],
      reports: [
        {
          id: "report-1",
          cluster_id: "cluster-1",
          user_category: "light",
          description: "Street light has been off for days",
          photo_url: "https://cdn.citypulse.test/report.jpg",
          lat: 43.24,
          lng: 76.89,
          address: "Толе би 30",
          district: "Алмалинский",
          severity: 2,
          status: "open",
          ai_category: "light",
          ai_confidence: 0.91,
          ai_tags: [],
          ai_validation_status: "valid",
          ai_needs_review: false,
          ai_reason: "Confirmed light issue",
          ai_visual_severity: "medium",
          ai_priority_score: 10,
          ai_priority_reason: "Initial priority",
          ai_top_factors: [],
          review_status: "pending",
          ai_correct: null,
          expert_category: null,
          expert_visual_severity: null,
          review_note: null,
          reviewed_by: null,
          reviewed_at: null,
          ai_deep_analysis: null,
          ai_deep_analyzed_at: null,
          ai_raw: null,
          submitted_by: "citizen-light@citypulse.local",
          created_at: "2026-04-04T09:00:00.000Z",
          updated_at: "2026-04-04T09:00:00.000Z",
        },
      ],
    });
    createSupabaseAdminClientMock.mockReturnValue(fakeAdmin);

    const { listReports, listStatusHistory, updateClusterStatus } = await import("@/lib/data-store");

    const updatedCluster = await updateClusterStatus("cluster-1", "closed", "admin-1");
    const reports = await listReports({ submittedBy: "citizen-light@citypulse.local" });
    const history = await listStatusHistory("cluster-1");

    expect(updatedCluster?.status).toBe("closed");
    expect(reports[0]?.status).toBe("closed");
    expect(history[0]).toMatchObject({
      clusterId: "cluster-1",
      newStatus: "closed",
      changedBy: "admin-1",
    });
    expect(fakeAdmin.tables.status_history).toHaveLength(1);
  });

  it("builds a citizen verification queue and skips reports already voted by the current user", async () => {
    const fakeAdmin = createFakeAdminClient({
      reports: [
        {
          id: "report-1",
          cluster_id: "cluster-1",
          user_category: "road",
          description: "Broken asphalt near the bus stop",
          photo_url: "https://cdn.citypulse.test/report-1.jpg",
          lat: 43.24,
          lng: 76.89,
          address: "Абая 10",
          district: "Алмалинский",
          severity: 4,
          status: "open",
          ai_category: "road",
          ai_confidence: 0.91,
          ai_tags: [],
          ai_validation_status: "uncertain",
          ai_needs_review: true,
          ai_reason: "Needs additional validation",
          ai_visual_severity: "medium",
          ai_priority_score: 12,
          ai_priority_reason: "Priority",
          ai_top_factors: [],
          review_status: "pending",
          created_at: "2026-04-05T09:00:00.000Z",
          updated_at: "2026-04-05T09:00:00.000Z",
        },
        {
          id: "report-2",
          cluster_id: "cluster-2",
          user_category: "light",
          description: "Street light is out",
          photo_url: "https://cdn.citypulse.test/report-2.jpg",
          lat: 43.25,
          lng: 76.9,
          address: "Толе би 12",
          district: "Алмалинский",
          severity: 3,
          status: "open",
          ai_category: "light",
          ai_confidence: 0.95,
          ai_tags: [],
          ai_validation_status: "valid",
          ai_needs_review: false,
          ai_reason: "Looks valid",
          ai_visual_severity: "medium",
          ai_priority_score: 10,
          ai_priority_reason: "Priority",
          ai_top_factors: [],
          review_status: "pending",
          human_votes_total: 2,
          human_real_votes: 2,
          human_fake_votes: 0,
          created_at: "2026-04-04T09:00:00.000Z",
          updated_at: "2026-04-04T09:00:00.000Z",
        },
        {
          id: "report-3",
          cluster_id: "cluster-3",
          user_category: "trash",
          description: "Overflowing garbage",
          photo_url: "https://cdn.citypulse.test/report-3.jpg",
          lat: 43.26,
          lng: 76.91,
          address: "Сатпаева 7",
          district: "Бостандыкский",
          severity: 5,
          status: "open",
          ai_category: "trash",
          ai_confidence: 0.72,
          ai_tags: [],
          ai_validation_status: "invalid",
          ai_needs_review: true,
          ai_reason: "Potential mismatch",
          ai_visual_severity: "high",
          ai_priority_score: 18,
          ai_priority_reason: "Priority",
          ai_top_factors: [],
          review_status: "pending",
          created_at: "2026-04-05T10:00:00.000Z",
          updated_at: "2026-04-05T10:00:00.000Z",
        },
      ],
      report_human_votes: [
        {
          report_id: "report-3",
          user_id: "citizen-1",
          verdict: "real",
        },
      ],
    });
    createSupabaseAdminClientMock.mockReturnValue(fakeAdmin);

    const { listCitizenVerificationQueue } = await import("@/lib/data-store");
    const queue = await listCitizenVerificationQueue("citizen-1", { limit: 5 });

    expect(queue.map((report) => report.id)).toEqual(["report-1", "report-2"]);
  });

  it("can include already reviewed reports for demo replay mode", async () => {
    const fakeAdmin = createFakeAdminClient({
      reports: [
        {
          id: "report-1",
          cluster_id: "cluster-1",
          user_category: "road",
          description: "Broken asphalt near the bus stop",
          photo_url: "https://cdn.citypulse.test/report-1.jpg",
          lat: 43.24,
          lng: 76.89,
          address: "Абая 10",
          district: "Алмалинский",
          severity: 4,
          status: "open",
          ai_category: "road",
          ai_confidence: 0.91,
          ai_tags: [],
          ai_validation_status: "uncertain",
          ai_needs_review: true,
          ai_reason: "Needs additional validation",
          ai_visual_severity: "medium",
          ai_priority_score: 12,
          ai_priority_reason: "Priority",
          ai_top_factors: [],
          review_status: "pending",
          created_at: "2026-04-05T09:00:00.000Z",
          updated_at: "2026-04-05T09:00:00.000Z",
        },
        {
          id: "report-2",
          cluster_id: "cluster-2",
          user_category: "light",
          description: "Street light is out",
          photo_url: "https://cdn.citypulse.test/report-2.jpg",
          lat: 43.25,
          lng: 76.9,
          address: "Толе би 12",
          district: "Алмалинский",
          severity: 3,
          status: "open",
          ai_category: "light",
          ai_confidence: 0.95,
          ai_tags: [],
          ai_validation_status: "valid",
          ai_needs_review: false,
          ai_reason: "Looks valid",
          ai_visual_severity: "medium",
          ai_priority_score: 10,
          ai_priority_reason: "Priority",
          ai_top_factors: [],
          review_status: "pending",
          created_at: "2026-04-04T09:00:00.000Z",
          updated_at: "2026-04-04T09:00:00.000Z",
        },
      ],
      report_human_votes: [
        {
          report_id: "report-2",
          user_id: "citizen-demo",
          verdict: "real",
        },
      ],
    });
    createSupabaseAdminClientMock.mockReturnValue(fakeAdmin);

    const { listCitizenVerificationQueue } = await import("@/lib/data-store");
    const queue = await listCitizenVerificationQueue("citizen-demo", {
      limit: 5,
      includeReviewed: true,
    });

    expect(queue.map((report) => report.id)).toEqual(["report-1", "report-2"]);
  });

  it("upserts human votes and recalculates human confirmation aggregates", async () => {
    const fakeAdmin = createFakeAdminClient({
      reports: [
        {
          id: "report-1",
          cluster_id: "cluster-1",
          user_category: "road",
          description: "Broken asphalt",
          photo_url: "https://cdn.citypulse.test/report-1.jpg",
          lat: 43.24,
          lng: 76.89,
          address: "Абая 10",
          district: "Алмалинский",
          severity: 4,
          status: "open",
          ai_category: "road",
          ai_confidence: 0.91,
          ai_tags: [],
          ai_validation_status: "valid",
          ai_needs_review: false,
          ai_reason: "Looks valid",
          ai_visual_severity: "medium",
          ai_priority_score: 12,
          ai_priority_reason: "Priority",
          ai_top_factors: [],
          review_status: "pending",
          created_at: "2026-04-05T09:00:00.000Z",
          updated_at: "2026-04-05T09:00:00.000Z",
        },
      ],
    });
    createSupabaseAdminClientMock.mockReturnValue(fakeAdmin);

    const { upsertHumanVoteForReport } = await import("@/lib/data-store");

    await upsertHumanVoteForReport("report-1", "citizen-1", "real");
    await upsertHumanVoteForReport("report-1", "citizen-1", "fake");
    await upsertHumanVoteForReport("report-1", "citizen-2", "real");
    const updated = await upsertHumanVoteForReport("report-1", "citizen-3", "real");

    expect(updated).toMatchObject({
      id: "report-1",
      humanRealVotes: 2,
      humanFakeVotes: 1,
      humanVotesTotal: 3,
      humanConfirmationStatus: "disputed",
    });
    expect(fakeAdmin.tables.report_human_votes).toHaveLength(3);
  });
});
