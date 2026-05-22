import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  assertIsDataWithResponseInit,
  submitAuthed,
} from "~/routes/tests/helpers";
import type { User } from "~/database/schema";

const mockDb = vi.hoisted(() => ({
  selectMock: vi.fn(),
  transactionMock: vi.fn(),
}));

vi.mock("~/database/context", () => ({
  database: () => ({
    select: mockDb.selectMock,
    transaction: mockDb.transactionMock,
  }),
}));

vi.mock("~/lib/auth/upsert-user.server", () => ({
  invalidateLocalUserCache: vi.fn(),
}));

const { action } = await import("../bug-detail");

// =============================================================================
// Fixtures
// =============================================================================

const REPORTER: User = {
  id: "user-reporter-1",
  role: "reporter",
  displayName: "Alice Reporter",
  createdAt: new Date("2026-01-01T00:00:00Z"),
  updatedAt: new Date("2026-01-01T00:00:00Z"),
};

const SDE: User = {
  ...REPORTER,
  id: "user-sde-1",
  role: "sde",
};

const ADMIN: User = {
  ...REPORTER,
  id: "user-admin-1",
  role: "admin",
};

// =============================================================================
// Mock helpers
// =============================================================================

function stubBugLookup(bug: {
  id: number;
  status: string;
  assigneeId?: string | null;
}) {
  mockDb.selectMock.mockReturnValueOnce({
    from: () => ({
      where: () => ({
        limit: async () => [bug],
      }),
    }),
  });
}

function stubTargetUserLookup(user: { id: string; role: User["role"] } | null) {
  mockDb.selectMock.mockReturnValueOnce({
    from: () => ({
      where: () => ({
        limit: async () => (user ? [user] : []),
      }),
    }),
  });
}

function stubReporterOwnership(reporterId: string | null) {
  mockDb.selectMock.mockReturnValueOnce({
    from: () => ({
      where: () => ({
        limit: async () => (reporterId === null ? [] : [{ reporterId }]),
      }),
    }),
  });
}

function stubTransactionSucceeds() {
  mockDb.transactionMock.mockImplementationOnce(
    async (fn: (tx: unknown) => unknown) => {
      const tx = {
        update: () => ({
          set: () => ({
            where: async () => undefined,
          }),
        }),
        insert: () => ({
          values: async () => undefined,
        }),
      };
      return fn(tx);
    },
  );
}

const post = (
  caller: User,
  fields: Record<string, string>,
  bugId = "1",
): ReturnType<typeof submitAuthed> =>
  submitAuthed(
    action,
    `http://localhost:3000/bugs/${bugId}`,
    { localUser: caller, params: { id: bugId } },
    fields,
  );

beforeEach(() => {
  mockDb.selectMock.mockReset();
  mockDb.transactionMock.mockReset();
});

// =============================================================================
// Tests
// =============================================================================

describe("POST /bugs/:id action", () => {
  describe("Status state machine (change-status intent)", () => {
    it("rejects a Reporter trying to move new→triaged with 409", async () => {
      // Bug is in 'new'. A reporter cannot drive forward progress as
      // only SDE or Admin can move new to triaged. Even when the
      // Reporter owns this bug, the state machine should still reject.
      stubReporterOwnership(REPORTER.id);
      stubBugLookup({ id: 1, status: "new" });

      const result = await post(REPORTER, {
        intent: "change-status",
        to: "triaged",
      });

      assertIsDataWithResponseInit(result);
      expect(result.init?.status).toBe(409);
      expect(result.data).toMatchObject({
        ok: false,
        error: expect.any(String),
        allowed: expect.any(Array),
      });
      // no transaction should run as state-machine rejection is
      // before the UPDATE+audit transaction.
      expect(mockDb.transactionMock).not.toHaveBeenCalled();
    });

    it("rejects an SDE trying to force-close (in_review to closed) with 409", async () => {
      // Closure requires Admin verification as SDEs can only move to
      // 'resolved'. Posting to=closed must be rejected.
      stubBugLookup({ id: 1, status: "in_review" });

      const result = await post(SDE, {
        intent: "change-status",
        to: "closed",
      });

      assertIsDataWithResponseInit(result);
      expect(result.init?.status).toBe(409);
      expect(mockDb.transactionMock).not.toHaveBeenCalled();
    });

    it("allows an Admin to force-close from in_review", async () => {
      stubBugLookup({ id: 1, status: "in_review" });
      stubTransactionSucceeds();

      const result = await post(ADMIN, {
        intent: "change-status",
        to: "closed",
      });

      assertIsDataWithResponseInit(result);
      expect(result.init?.status ?? 200).toBe(200);
      expect(result.data).toMatchObject({ ok: true, status: "closed" });
      expect(mockDb.transactionMock).toHaveBeenCalledTimes(1);
    });

    it("rejects malformed target status with 400 (not 409)", async () => {
      // No state machine consultation, the input is rejected at the
      // type guard before any DB hit. This ensures 'some-fake-status' doesn't
      // somehow become a valid status.
      const result = await post(SDE, {
        intent: "change-status",
        to: "fake-status",
      });

      assertIsDataWithResponseInit(result);
      expect(result.init?.status).toBe(400);
      expect(result.data).toMatchObject({ error: "Invalid target status" });
      expect(mockDb.selectMock).not.toHaveBeenCalled();
    });

    it("returns 404 when the bug does not exist or is soft-deleted", async () => {
      mockDb.selectMock.mockReturnValueOnce({
        from: () => ({
          where: () => ({
            limit: async () => [],
          }),
        }),
      });

      const result = await post(SDE, {
        intent: "change-status",
        to: "triaged",
      });

      assertIsDataWithResponseInit(result);
      expect(result.init?.status).toBe(404);
      expect(mockDb.transactionMock).not.toHaveBeenCalled();
    });
  });

  describe("Reporter ownership boundary", () => {
    it("returns 404 when a Reporter targets a bug they don't own", async () => {
      stubReporterOwnership("some-other-reporter-id");

      const result = await post(REPORTER, {
        intent: "add-comment",
        body: "trying to comment on someone else's bug",
      });

      assertIsDataWithResponseInit(result);
      expect(result.init?.status).toBe(404);
      expect(result.data).toMatchObject({ error: "Bug not found" });
      // No transaction ran as the action handler never
      // got the chance to run because the guard short-circuited.
      expect(mockDb.transactionMock).not.toHaveBeenCalled();
    });

    it("returns 404 when a Reporter targets a non-existent bug", async () => {
      // Same response as the not yours case. Identical shape so the
      // existence of bugs cannot be inferred from response timing or
      // body.
      stubReporterOwnership(null);

      const result = await post(REPORTER, {
        intent: "add-comment",
        body: "any body",
      });

      assertIsDataWithResponseInit(result);
      expect(result.init?.status).toBe(404);
      expect(result.data).toMatchObject({ error: "Bug not found" });
    });

    it("does NOT run the ownership guard for SDE callers", async () => {
      stubBugLookup({ id: 1, status: "new" });
      stubTransactionSucceeds();

      const result = await post(SDE, {
        intent: "change-status",
        to: "triaged",
      });

      assertIsDataWithResponseInit(result);
      expect(result.init?.status ?? 200).toBe(200);
      // Exactly one SELECT for SDEs (the action's bug lookup).
      // If the guard wasn't role-gated this would be 2.
      expect(mockDb.selectMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("Assignee role rule (change-assignee intent)", () => {
    it("rejects a Reporter trying to change assignee with 403", async () => {
      stubReporterOwnership(REPORTER.id);
      const result = await post(REPORTER, {
        intent: "change-assignee",
        assigneeId: SDE.id,
      });

      assertIsDataWithResponseInit(result);
      expect(result.init?.status).toBe(403);
      expect(result.data).toMatchObject({
        error: expect.stringContaining("Only SDEs and Admins"),
      });
    });

    it("rejects assigning a Reporter as the assignee with 400", async () => {
      // Bug exists, caller is SDE but the target is a Reporter.
      // Reporters file bugs, they don't fix them.
      stubBugLookup({ id: 1, status: "triaged", assigneeId: null });
      stubTargetUserLookup({ id: REPORTER.id, role: "reporter" });

      const result = await post(SDE, {
        intent: "change-assignee",
        assigneeId: REPORTER.id,
      });

      assertIsDataWithResponseInit(result);
      expect(result.init?.status).toBe(400);
      expect(result.data).toMatchObject({
        error: expect.stringContaining("only be assigned to SDEs or Admins"),
      });
      expect(mockDb.transactionMock).not.toHaveBeenCalled();
    });

    it("rejects assigning a non-existent user with 400", async () => {
      stubBugLookup({ id: 1, status: "triaged", assigneeId: null });
      stubTargetUserLookup(null);

      const result = await post(SDE, {
        intent: "change-assignee",
        assigneeId: "ghost-user-id",
      });

      assertIsDataWithResponseInit(result);
      expect(result.init?.status).toBe(400);
      expect(result.data).toMatchObject({ error: "Assignee not found" });
    });

    it("allows an SDE to assign another SDE", async () => {
      stubBugLookup({ id: 1, status: "triaged", assigneeId: null });
      stubTargetUserLookup({ id: SDE.id, role: "sde" });
      stubTransactionSucceeds();

      const result = await post(SDE, {
        intent: "change-assignee",
        assigneeId: SDE.id,
      });

      assertIsDataWithResponseInit(result);
      expect(result.init?.status ?? 200).toBe(200);
      expect(mockDb.transactionMock).toHaveBeenCalledTimes(1);
    });

    it("rejects unassigning a closed bug with 400 (must reopen first)", async () => {
      stubBugLookup({ id: 1, status: "closed", assigneeId: SDE.id });

      const result = await post(SDE, {
        intent: "change-assignee",
        assigneeId: "", // unassign
      });

      assertIsDataWithResponseInit(result);
      expect(result.init?.status).toBe(400);
      expect(result.data).toMatchObject({
        error: expect.stringContaining("Reopen it first"),
      });
      expect(mockDb.transactionMock).not.toHaveBeenCalled();
    });
  });
});
