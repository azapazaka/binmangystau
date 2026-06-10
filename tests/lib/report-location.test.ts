import { beforeEach, describe, expect, it, vi } from "vitest";

const createSupabaseAdminClientMock = vi.fn();
const reverseGeocodeMock = vi.fn();
const classifyReportImageMock = vi.fn();

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
  forwardGeocode: vi.fn(),
}));

vi.mock("@/lib/ai/classify-report-image", () => ({
  classifyReportImage: classifyReportImageMock,
}));

vi.mock("@/lib/ai/provider", () => ({
  analyzeReportWithProvider: vi.fn(),
}));

type Row = Record<string, unknown>;
type TableName = "clusters" | "reports" | "status_history";

function createPhotoFile(name = "report.jpg") {
  const bytes = new TextEncoder().encode("demo-image");

  return {
    arrayBuffer: async () => bytes.buffer.slice(0),
    name,
    size: bytes.byteLength,
    type: "image/jpeg",
  } as File;
}

function createFakeAdminClient() {
  const tables: Record<TableName, Row[]> = {
    clusters: [],
    reports: [],
    status_history: [],
  };

  class Query {
    private filters: Array<(row: Row) => boolean> = [];
    private insertedRows: Row[] | null = null;
    private updateValues: Row | null = null;
    private singleRow = false;

    constructor(private readonly table: TableName) {}

    select() {
      return this;
    }

    insert(payload: Row | Row[]) {
      const rows = Array.isArray(payload) ? payload : [payload];
      this.insertedRows = rows.map((row) => normalizeInsertedRow(this.table, row));
      tables[this.table].push(...this.insertedRows);
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
        const updatedRows = tables[this.table]
          .filter((row) => this.filters.every((filter) => filter(row)))
          .map((row) => Object.assign(row, this.updateValues));

        return {
          data: this.singleRow ? updatedRows[0] ?? null : updatedRows,
          error: null,
          count: null,
        };
      }

      if (this.insertedRows) {
        return {
          data: this.singleRow ? this.insertedRows[0] ?? null : this.insertedRows,
          error: null,
          count: null,
        };
      }

      const rows = tables[this.table].filter((row) => this.filters.every((filter) => filter(row)));

      return {
        data: this.singleRow ? rows[0] ?? null : rows,
        error: null,
        count: null,
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
    storageUploadMock,
  };
}

function normalizeInsertedRow(table: TableName, row: Row) {
  const now = "2026-04-05T09:00:00.000Z";

  if (table === "clusters") {
    return {
      id: row.id ?? "cluster-generated",
      status: "open",
      created_at: now,
      updated_at: now,
      ...row,
    };
  }

  if (table === "reports") {
    return {
      id: row.id ?? "report-generated",
      created_at: now,
      updated_at: now,
      ...row,
    };
  }

  return {
    id: row.id ?? "history-generated",
    changed_at: now,
    ...row,
  };
}

describe("report location source handling", () => {
  beforeEach(() => {
    vi.resetModules();
    createSupabaseAdminClientMock.mockReset();
    reverseGeocodeMock.mockReset();
    classifyReportImageMock.mockReset();
  });

  it.each(["geolocation", "map"] as const)(
    "keeps %s coordinates as the source of truth while showing the chosen address label",
    async (locationSource) => {
      const fakeAdmin = createFakeAdminClient();
      createSupabaseAdminClientMock.mockReturnValue(fakeAdmin);

      reverseGeocodeMock.mockResolvedValue({
        lat: 51.1282,
        lng: 71.4304,
        address: "Астана, проспект Мангилик Ел, 12",
        district: "Есильский",
        zoneKey: "esil",
        zoneCoefficient: 1.3,
      });

      classifyReportImageMock.mockResolvedValue({
        aiCategory: "traffic",
        aiConfidence: 0.92,
        aiTags: ["traffic-light"],
        aiValidationStatus: "valid",
        aiNeedsReview: false,
        aiReason: "Traffic light issue detected.",
        aiVisualSeverity: "medium",
      });

      const { createReport } = await import("@/lib/data-store");

      const createdReport = await createReport({
        category: "traffic",
        description: "Светофор не работает у перехода",
        lat: 51.1282,
        lng: 71.4304,
        addressLabel: "Астана, проспект Мангилик Ел, 12",
        locationSource,
        photo: createPhotoFile(`${locationSource}.jpg`),
        submittedBy: `${locationSource}@citypulse.local`,
      } as never);

      expect(createdReport).not.toBeNull();
      expect(createdReport?.lat).toBe(51.1282);
      expect(createdReport?.lng).toBe(71.4304);
      expect(createdReport?.address).toBe("Астана, проспект Мангилик Ел, 12");
      expect(fakeAdmin.storageUploadMock).toHaveBeenCalledTimes(1);
    },
  );
});
