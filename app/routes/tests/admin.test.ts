import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  assertIsDataWithResponseInit,
  submitAuthed,
} from "~/routes/tests/helpers";
import type { User } from "~/database/schema";

// =============================================================================
// Mocks
// =============================================================================

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

const invalidateMock = vi.hoisted(() => vi.fn());
vi.mock("~/lib/auth/upsert-user.server", () => ({
  invalidateLocalUserCache: invalidateMock,
}));

const { action } = await import("../admin");

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
  displayName: "Bob Engineer",
};

const ADMIN: User = {
  ...REPORTER,
  id: "user-admin-1",
  role: "admin",
  displayName: "Carol Admin",
};

const TARGET_REPORTER: User = {
  ...REPORTER,
  id: "user-target-1",
  displayName: "Dave Target",
};

// =============================================================================
// Helpers
// =============================================================================

function stubSelectReturnsTarget(target: { id: string; role: User["role"] }) {
  mockDb.selectMock.mockReturnValueOnce({
    from: () => ({
      where: () => ({
        limit: async () => [target],
      }),
    }),
  });
}

function stubSelectReturnsNoTarget() {
  mockDb.selectMock.mockReturnValueOnce({
    from: () => ({
      where: () => ({
        limit: async () => [],
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
): ReturnType<typeof submitAuthed> =>
  submitAuthed(
    action,
    "http://localhost:3000/admin",
    { localUser: caller },
    fields,
  );

beforeEach(() => {
  mockDb.selectMock.mockReset();
  mockDb.transactionMock.mockReset();
  invalidateMock.mockReset();
});

// =============================================================================
// Tests
// =============================================================================

describe("POST /admin action (role management)", () => {
  describe("RBAC enforcement", () => {
    it("rejects a reporter calling change-role with 403", async () => {
      const result = await post(REPORTER, {
        intent: "change-role",
        userId: TARGET_REPORTER.id,
        role: "admin",
      });
      assertIsDataWithResponseInit(result);
      expect(result.init.status).toBe(403);
      expect(result.data).toMatchObject({ ok: false, error: "Forbidden" });
      // No DB call — the role check short-circuits before any SQL.
      expect(mockDb.selectMock).not.toHaveBeenCalled();
      expect(mockDb.transactionMock).not.toHaveBeenCalled();
    });

    it("rejects an SDE calling change-role with 403", async () => {
      const result = await post(SDE, {
        intent: "change-role",
        userId: TARGET_REPORTER.id,
        role: "admin",
      });
      assertIsDataWithResponseInit(result);
      expect(result.init.status).toBe(403);
      expect(mockDb.selectMock).not.toHaveBeenCalled();
    });

    it("allows an admin to change another user's role", async () => {
      stubSelectReturnsTarget({ id: TARGET_REPORTER.id, role: "reporter" });
      stubTransactionSucceeds();

      const result = await post(ADMIN, {
        intent: "change-role",
        userId: TARGET_REPORTER.id,
        role: "sde",
      });

      assertIsDataWithResponseInit(result);
      expect(result.init?.status ?? 200).toBe(200);
      expect(result.data).toMatchObject({
        ok: true,
        noop: false,
        role: "sde",
      });
      // Audit + UPDATE happen inside the transaction; we only verify
      // the transaction ran.
      expect(mockDb.transactionMock).toHaveBeenCalledTimes(1);
      // Cache invalidated for the target so their next request reads
      // fresh role data.
      expect(invalidateMock).toHaveBeenCalledWith(TARGET_REPORTER.id);
    });
  });

  describe("Self-demotion guard", () => {
    it("rejects an admin demoting themselves to sde with 400", async () => {
      const result = await post(ADMIN, {
        intent: "change-role",
        userId: ADMIN.id, // self
        role: "sde",
      });
      assertIsDataWithResponseInit(result);
      expect(result.init.status).toBe(400);
      expect(result.data).toMatchObject({
        ok: false,
        error: expect.stringContaining("cannot demote yourself"),
      });
      // no DB call as guard runs before SELECT.
      expect(mockDb.selectMock).not.toHaveBeenCalled();
      expect(mockDb.transactionMock).not.toHaveBeenCalled();
    });

    it("rejects an admin demoting themselves to reporter with 400", async () => {
      const result = await post(ADMIN, {
        intent: "change-role",
        userId: ADMIN.id,
        role: "reporter",
      });
      assertIsDataWithResponseInit(result);
      expect(result.init.status).toBe(400);
    });

    it("allows an admin to set their own role to admin (no-op)", async () => {
      // Self-targeting with role=admin is permitted by the guard but
      // becomes a no-op when the SELECT confirms current role is admin.
      stubSelectReturnsTarget({ id: ADMIN.id, role: "admin" });
      const result = await post(ADMIN, {
        intent: "change-role",
        userId: ADMIN.id,
        role: "admin",
      });
      assertIsDataWithResponseInit(result);
      expect(result.data).toMatchObject({ ok: true, noop: true });
    });
  });

  describe("input validation", () => {
    it("rejects unknown intents with 400", async () => {
      const result = await post(ADMIN, {
        intent: "delete-user", // not a real intent
        userId: TARGET_REPORTER.id,
        role: "admin",
      });
      assertIsDataWithResponseInit(result);
      expect(result.init.status).toBe(400);
      expect(result.data).toMatchObject({ error: "Unknown intent" });
    });

    it("rejects invalid role values with 400 (zod enforcement)", async () => {
      const result = await post(ADMIN, {
        intent: "change-role",
        userId: TARGET_REPORTER.id,
        role: "superadmin", // not in the enum
      });
      assertIsDataWithResponseInit(result);
      expect(result.init.status).toBe(400);
      expect(result.data).toMatchObject({ error: "Invalid input" });
    });

    it("rejects missing userId with 400", async () => {
      const result = await post(ADMIN, {
        intent: "change-role",
        role: "admin",
      });
      assertIsDataWithResponseInit(result);
      expect(result.init.status).toBe(400);
    });
  });

  describe("target user not found", () => {
    it("returns 404 when the target user does not exist", async () => {
      stubSelectReturnsNoTarget();
      const result = await post(ADMIN, {
        intent: "change-role",
        userId: "nonexistent-user-id",
        role: "admin",
      });
      assertIsDataWithResponseInit(result);
      expect(result.init.status).toBe(404);
      expect(result.data).toMatchObject({ error: "User not found" });
      // No transaction ran as we bailed before mutating.
      expect(mockDb.transactionMock).not.toHaveBeenCalled();
    });
  });

  describe("no-op detection", () => {
    it("returns ok+noop when the target's role is unchanged", async () => {
      stubSelectReturnsTarget({ id: TARGET_REPORTER.id, role: "sde" });
      const result = await post(ADMIN, {
        intent: "change-role",
        userId: TARGET_REPORTER.id,
        role: "sde", // already sde
      });
      assertIsDataWithResponseInit(result);
      expect(result.data).toMatchObject({
        ok: true,
        noop: true,
        role: "sde",
      });
      // No transaction, no audit row, no cache invalidation.
      expect(mockDb.transactionMock).not.toHaveBeenCalled();
      expect(invalidateMock).not.toHaveBeenCalled();
    });
  });
});
