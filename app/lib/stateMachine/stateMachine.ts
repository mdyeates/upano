export type BugStatus =
  | "new"
  | "triaged"
  | "in_progress"
  | "in_review"
  | "resolved"
  | "closed";

export type UserRole = "reporter" | "sde" | "admin";

// =============================================================================
// Transition matrix
// =============================================================================

const TRANSITIONS: Record<UserRole, Record<BugStatus, readonly BugStatus[]>> = {
  reporter: {
    new: [],
    triaged: [],
    in_progress: [],
    in_review: [],
    // Reporters should be able to re-open if the bug was not resolved.
    resolved: ["triaged"],
    closed: ["triaged"],
  },
  sde: {
    new: ["triaged"],
    triaged: ["in_progress"],
    // Kick-back to triage is allowed (for example: needs more info).
    in_progress: ["in_review", "triaged"],
    in_review: ["resolved", "in_progress"],
    // SDEs cannot close. Closure is an Admin verification step.
    resolved: [],
    closed: [],
  },
  admin: {
    // Admin can do everything an SDE can do, plus force-close from any
    // non-closed state, plus re-open from closed.
    new: ["triaged", "closed"],
    triaged: ["in_progress", "closed"],
    in_progress: ["in_review", "triaged", "closed"],
    in_review: ["resolved", "in_progress", "closed"],
    resolved: ["closed", "triaged"],
    closed: ["triaged"],
  },
} as const;

// =============================================================================
// State machine APIs
// =============================================================================

/**
 * Determines if a role can transition a bug to a new state.
 * Prevents transitioning to same state,
 * as this doesn't need to be logged in the audit trail.
 */
export function canTransition(
  from: BugStatus,
  to: BugStatus,
  role: UserRole,
): boolean {
  if (from === to) return false;
  return TRANSITIONS[role][from].includes(to);
}

/**
 * Returns the set of states this role can move to from `from`.
 */
export function allowedTransitionsFor(
  from: BugStatus,
  role: UserRole,
): BugStatus[] {
  return [...TRANSITIONS[role][from]];
}

/**
 * Action entry point. Throws InvalidTransitionError if the
 * transition is not allowed.
 *
 * Use as:
 *   try {
 *     validateTransition({ from: bug.status, to: newStatus, role: user.role });
 *   } catch (err) {
 *     if (err instanceof InvalidTransitionError) {
 *       return data({ error: err.message, allowed: err.allowed }, { status: 409 });
 *     }
 *     throw err;
 *   }
 */
export function validateTransition(args: {
  from: BugStatus;
  to: BugStatus;
  role: UserRole;
}): void {
  if (!canTransition(args.from, args.to, args.role)) {
    throw new InvalidTransitionError(args);
  }
}

/**
 * Thrown when a transition is rejected.
 */
export class InvalidTransitionError extends Error {
  readonly from: BugStatus;
  readonly to: BugStatus;
  readonly role: UserRole;
  readonly allowed: BugStatus[];

  constructor(args: { from: BugStatus; to: BugStatus; role: UserRole }) {
    const allowed = allowedTransitionsFor(args.from, args.role);
    const allowedStr =
      allowed.length === 0
        ? "no transitions are allowed for this role from this state"
        : `allowed: ${allowed.join(", ")}`;
    super(
      `Role '${args.role}' cannot transition bug from '${args.from}' to '${args.to}' (${allowedStr})`,
    );
    this.name = "InvalidTransitionError";
    this.from = args.from;
    this.to = args.to;
    this.role = args.role;
    this.allowed = allowed;
  }
}
