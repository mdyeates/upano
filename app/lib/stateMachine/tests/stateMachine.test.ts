import { describe, expect, it } from "vitest";
import {
  allowedTransitionsFor,
  canTransition,
  InvalidTransitionError,
  validateTransition,
  type BugStatus,
  type UserRole,
} from "~/lib/stateMachine/stateMachine";

const ALL_STATUSES: BugStatus[] = [
  "new",
  "triaged",
  "in_progress",
  "in_review",
  "resolved",
  "closed",
];

const ALL_ROLES: UserRole[] = ["reporter", "sde", "admin"];

// Source of truth for the allowed transitions matrix.
const EXPECTED: Record<UserRole, Record<BugStatus, BugStatus[]>> = {
  reporter: {
    new: [],
    triaged: [],
    in_progress: [],
    in_review: [],
    resolved: ["triaged"],
    closed: ["triaged"],
  },
  sde: {
    new: ["triaged"],
    triaged: ["in_progress"],
    in_progress: ["in_review", "triaged"],
    in_review: ["resolved", "in_progress"],
    resolved: [],
    closed: [],
  },
  admin: {
    new: ["triaged", "closed"],
    triaged: ["in_progress", "closed"],
    in_progress: ["in_review", "triaged", "closed"],
    in_review: ["resolved", "in_progress", "closed"],
    resolved: ["closed", "triaged"],
    closed: ["triaged"],
  },
};

describe("canTransition()", () => {
  // Generate tests: for every role/transition
  for (const role of ALL_ROLES) {
    for (const from of ALL_STATUSES) {
      for (const to of ALL_STATUSES) {
        const expected = from !== to && EXPECTED[role][from].includes(to);
        const verb = expected ? "allows" : "rejects";

        it(`${role}: ${verb} ${from} \u2192 ${to}`, () => {
          expect(canTransition(from, to, role)).toBe(expected);
        });
      }
    }
  }
});

describe("self transitions", () => {
  for (const role of ALL_ROLES) {
    for (const status of ALL_STATUSES) {
      it(`${role}: rejects ${status} \u2192 ${status}`, () => {
        expect(canTransition(status, status, role)).toBe(false);
      });
    }
  }
});

describe("allowedTransitionsFor()", () => {
  for (const role of ALL_ROLES) {
    for (const from of ALL_STATUSES) {
      it(`${role} from ${from} \u2192 ${EXPECTED[role][from].join(", ") || "(none)"}`, () => {
        expect(allowedTransitionsFor(from, role).sort()).toEqual(
          [...EXPECTED[role][from]].sort(),
        );
      });
    }
  }
});

describe("validateTransition()", () => {
  it("returns void on a legal transition", () => {
    expect(() =>
      validateTransition({ from: "new", to: "triaged", role: "sde" }),
    ).not.toThrow();
  });

  it("throws InvalidTransitionError on an illegal transition", () => {
    expect(() =>
      validateTransition({ from: "new", to: "resolved", role: "sde" }),
    ).toThrow(InvalidTransitionError);
  });

  it("error carries the allowed transitions for the role", () => {
    try {
      validateTransition({ from: "new", to: "resolved", role: "sde" });
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(InvalidTransitionError);
      const e = err as InvalidTransitionError;
      expect(e.allowed).toEqual(["triaged"]);
      expect(e.from).toBe("new");
      expect(e.to).toBe("resolved");
      expect(e.role).toBe("sde");
    }
  });

  it("error message includes the allowed-set for the action layer to surface", () => {
    try {
      validateTransition({
        from: "in_progress",
        to: "closed",
        role: "sde",
      });
      expect.fail("should have thrown");
    } catch (err) {
      expect((err as Error).message).toMatch(/allowed: in_review, triaged/);
    }
  });

  it("rejects self transitions with a clear error", () => {
    try {
      validateTransition({
        from: "triaged",
        to: "triaged",
        role: "sde",
      });
      expect.fail("should have thrown");
    } catch (err) {
      expect(err).toBeInstanceOf(InvalidTransitionError);
    }
  });

  it("rejects with 'no transitions allowed' when the role has none", () => {
    try {
      validateTransition({
        from: "in_progress",
        to: "resolved",
        role: "reporter",
      });
      expect.fail("should have thrown");
    } catch (err) {
      expect((err as Error).message).toMatch(/no transitions are allowed/);
    }
  });
});

describe("spot checks", () => {

  it("should not be allowed to move from 'new' straight to 'resolved' (any role)", () => {
    for (const role of ALL_ROLES) {
      expect(canTransition("new", "resolved", role)).toBe(false);
    }
  });

  it("should only allow Admins to close a bug", () => {
    expect(canTransition("resolved", "closed", "reporter")).toBe(false);
    expect(canTransition("resolved", "closed", "sde")).toBe(false);
    expect(canTransition("resolved", "closed", "admin")).toBe(true);
  });

  it("it should allow Reporters to re-open from resolved or closed", () => {
    expect(canTransition("resolved", "triaged", "reporter")).toBe(true);
    expect(canTransition("closed", "triaged", "reporter")).toBe(true);
  });

  it("it should prevent Reporters transitioning on their own bugs", () => {
    expect(canTransition("new", "triaged", "reporter")).toBe(false);
    expect(canTransition("triaged", "in_progress", "reporter")).toBe(false);
    expect(canTransition("in_progress", "in_review", "reporter")).toBe(false);
    expect(canTransition("in_review", "resolved", "reporter")).toBe(false);
  });

  it("it should allow SDEs to move bugs back from in_progress to triaged", () => {
    expect(canTransition("in_progress", "triaged", "sde")).toBe(true);
  });

  it("it should allow SDEs to move bugs back from in_review to in_progress", () => {
    expect(canTransition("in_review", "in_progress", "sde")).toBe(true);
  });
});
