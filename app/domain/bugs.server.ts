import { and, desc, eq, isNull } from "drizzle-orm";
import { database } from "~/database/context";
import {
  auditEvents,
  bugs,
  users,
  type Bug,
  type User,
} from "~/database/schema";
import { fetchUsersByIds, type UserDetails } from "~/lib/auth/user.service";
import {
  ForbiddenError,
  InvalidStateTransitionError,
  NotFoundError,
  ValidationError,
} from "./_errors";
import {
  InvalidTransitionError,
  validateTransition,
  type BugStatus,
} from "~/lib/stateMachine/stateMachine";

// =============================================================================
// Action: change a bug's status
// =============================================================================

const KNOWN_STATUSES: BugStatus[] = [
  "new",
  "triaged",
  "in_progress",
  "in_review",
  "resolved",
  "closed",
];

function isBugStatus(value: unknown): value is BugStatus {
  return KNOWN_STATUSES.includes(value as BugStatus);
}

export async function changeStatus({
  bugId,
  toStatus,
  actorId,
  actorRole,
}: {
  bugId: number;
  toStatus: unknown;
  actorId: string;
  actorRole: User["role"];
}): Promise<{ status: BugStatus }> {
  if (!isBugStatus(toStatus)) {
    throw new ValidationError("Invalid target status");
  }

  const db = database();

  const bugRows = await db
    .select({ id: bugs.id, status: bugs.status })
    .from(bugs)
    .where(and(eq(bugs.id, bugId), isNull(bugs.deletedAt)))
    .limit(1);
  const bug = bugRows[0];
  if (!bug) {
    throw new NotFoundError("Bug not found");
  }

  try {
    validateTransition({
      from: bug.status,
      to: toStatus,
      role: actorRole,
    });
  } catch (err) {
    if (err instanceof InvalidTransitionError) {
      throw new InvalidStateTransitionError(err.message, err.allowed);
    }
    throw err;
  }

  await db.transaction(async (tx) => {
    await tx
      .update(bugs)
      .set({
        status: toStatus,
        closedAt: toStatus === "closed" ? new Date() : null,
      })
      .where(eq(bugs.id, bugId));
    await tx.insert(auditEvents).values({
      bugId,
      actorId,
      eventType: "status_changed",
      field: "status",
      oldValue: bug.status,
      newValue: toStatus,
    });
  });

  return { status: toStatus };
}

// =============================================================================
// Action: change a bug's assignee
// =============================================================================

export async function changeAssignee({
  bugId,
  rawAssigneeId,
  actorId,
  actorRole,
}: {
  bugId: number;
  rawAssigneeId: unknown;
  actorId: string;
  actorRole: User["role"];
}): Promise<{ noop?: boolean }> {
  if (actorRole !== "sde" && actorRole !== "admin") {
    throw new ForbiddenError("Only SDEs and Admins can change assignees");
  }

  const targetId =
    typeof rawAssigneeId === "string" && rawAssigneeId.length > 0
      ? rawAssigneeId
      : null;

  const db = database();

  const bugRows = await db
    .select({
      id: bugs.id,
      assigneeId: bugs.assigneeId,
      status: bugs.status,
    })
    .from(bugs)
    .where(and(eq(bugs.id, bugId), isNull(bugs.deletedAt)))
    .limit(1);
  const bug = bugRows[0];
  if (!bug) {
    throw new NotFoundError("Bug not found");
  }

  if (targetId !== null) {
    const targetRows = await db
      .select({ id: users.id, role: users.role })
      .from(users)
      .where(eq(users.id, targetId))
      .limit(1);
    const target = targetRows[0];
    if (!target) {
      throw new ValidationError("Assignee not found");
    }
    if (target.role !== "sde" && target.role !== "admin") {
      throw new ValidationError("Bugs can only be assigned to SDEs or Admins");
    }
  }

  if (bug.assigneeId === targetId) {
    return { noop: true };
  }

  // Removing the assignee from an in-flight
  // bug sends it back to triaged.
  let cascadeToTriaged = false;
  if (targetId === null) {
    if (bug.status === "resolved" || bug.status === "closed") {
      throw new ValidationError(
        "Cannot unassign a resolved or closed bug. Reopen it first.",
      );
    }
    if (bug.status === "in_progress" || bug.status === "in_review") {
      cascadeToTriaged = true;
    }
  }

  await db.transaction(async (tx) => {
    await tx
      .update(bugs)
      .set({
        assigneeId: targetId,
        ...(cascadeToTriaged ? { status: "triaged" } : {}),
      })
      .where(eq(bugs.id, bugId));

    await tx.insert(auditEvents).values({
      bugId,
      actorId,
      eventType: "assignee_changed",
      field: "assignee_id",
      oldValue: bug.assigneeId,
      newValue: targetId,
    });

    if (cascadeToTriaged) {
      await tx.insert(auditEvents).values({
        bugId,
        actorId,
        eventType: "status_changed",
        field: "status",
        oldValue: bug.status,
        newValue: "triaged",
      });
    }
  });

  return {};
}

// =============================================================================
// Action: edit title or description
// =============================================================================

export async function editField({
  bugId,
  field,
  rawValue,
  actorId,
  actorRole,
}: {
  bugId: number;
  field: "title" | "description";
  rawValue: unknown;
  actorId: string;
  actorRole: User["role"];
}): Promise<{ noop?: boolean }> {
  // Per-field length rules. Keep in sync with the DB CHECK constraints
  // and the client-side maxLength props.
  const limits = {
    title: { min: 1, max: 50 },
    description: { min: 1, max: 10_000 },
  };
  const eventTypes = {
    title: "title_changed",
    description: "description_changed",
  } as const;
  const { min: minLength, max: maxLength } = limits[field];
  const eventType = eventTypes[field];

  if (typeof rawValue !== "string") {
    throw new ValidationError(`Missing ${field}`, field);
  }
  const trimmed = rawValue.trim();
  if (trimmed.length < minLength || trimmed.length > maxLength) {
    throw new ValidationError(
      `${field[0].toUpperCase()}${field.slice(1)} must be ${minLength}-${maxLength} characters`,
      field,
    );
  }

  const db = database();

  const bugRows = await db
    .select({
      id: bugs.id,
      reporterId: bugs.reporterId,
      title: bugs.title,
      description: bugs.description,
    })
    .from(bugs)
    .where(and(eq(bugs.id, bugId), isNull(bugs.deletedAt)))
    .limit(1);
  const bug = bugRows[0];
  if (!bug) {
    throw new NotFoundError("Bug not found");
  }

  const isReporterOfThisBug = bug.reporterId === actorId;
  const isPrivileged = actorRole === "sde" || actorRole === "admin";
  if (!isPrivileged && !isReporterOfThisBug) {
    throw new ForbiddenError("You can only edit bugs you reported");
  }

  const oldValue = field === "title" ? bug.title : bug.description;
  if (oldValue === trimmed) {
    return { noop: true };
  }

  await db.transaction(async (tx) => {
    await tx
      .update(bugs)
      .set({ [field]: trimmed })
      .where(eq(bugs.id, bugId));
    await tx.insert(auditEvents).values({
      bugId,
      actorId,
      eventType,
      field,
      oldValue,
      newValue: trimmed,
    });
  });

  return {};
}

// =============================================================================
// Action: create a new bug
// =============================================================================

export async function create({
  title,
  description,
  priority,
  severity,
  reporterId,
}: {
  title: string;
  description: string;
  priority: Bug["priority"];
  severity: Bug["severity"];
  reporterId: string;
}): Promise<{ id: number }> {
  const db = database();
  const inserted = await db.transaction(async (tx) => {
    const result = await tx
      .insert(bugs)
      .values({ title, description, priority, severity, reporterId })
      .returning({ id: bugs.id });
    await tx.insert(auditEvents).values({
      bugId: result[0].id,
      actorId: reporterId,
      eventType: "bug_created",
    });
    return result[0];
  });
  return { id: inserted.id };
}

// =============================================================================
// Reporter ownership guard (used by bug-detail action dispatcher)
// =============================================================================

/**
 * Verify a Reporter owns the bug they're acting on. Returns silently
 * when the actor isn't a Reporter (the guard is role-gated).
 */
export async function requireReporterOwnership({
  bugId,
  actorRole,
  actorId,
}: {
  bugId: number;
  actorRole: User["role"];
  actorId: string;
}): Promise<void> {
  // Role gate stays here so SDE/admin avoid the round-trip entirely.
  // Reporters delegate to getBugForViewer which performs the same
  // existence + ownership check and throws NotFoundError on miss.
  if (actorRole !== "reporter") return;
  await getBugForViewer({ bugId, actorRole, actorId });
}

// =============================================================================
// Loader-side: bug existence + ownership gate
// =============================================================================

export async function getBugForViewer({
  bugId,
  actorRole,
  actorId,
}: {
  bugId: number;
  actorRole: User["role"];
  actorId: string;
}): Promise<Bug> {
  const db = database();
  const rows = await db
    .select()
    .from(bugs)
    .where(and(eq(bugs.id, bugId), isNull(bugs.deletedAt)))
    .limit(1);
  const bug = rows[0];
  if (!bug) {
    throw new NotFoundError("Bug not found");
  }
  if (actorRole === "reporter" && bug.reporterId !== actorId) {
    throw new NotFoundError("Bug not found");
  }
  return bug;
}

// =============================================================================
// Loader-side: header users (reporter + assignee for the right rail)
// =============================================================================

/**
 * Resolve the reporter + (optional) assignee identities for the
 * bug-detail right rail. Throws when the reporter row is missing
 * (Should not happen but for graceful degradtion).
 */
export async function getHeaderUsers(bug: Bug): Promise<{
  reporter: UserDetails;
  assignee: UserDetails | null;
}> {
  const db = database();
  const ids = Array.from(
    new Set(
      [bug.reporterId, bug.assigneeId].filter(
        (id): id is string => id !== null,
      ),
    ),
  );
  const userDisplays = await fetchUsersByIds(db, ids);
  const userById = new Map(userDisplays.map((u) => [u.id, u]));
  const reporter = userById.get(bug.reporterId);
  if (!reporter) {
    throw new Error(
      `Bug ${bug.id} references missing reporter ${bug.reporterId}`,
    );
  }
  const assignee = bug.assigneeId
    ? (userById.get(bug.assigneeId) ?? null)
    : null;
  return { reporter, assignee };
}

// =============================================================================
// Loader-side: activity timeline
// =============================================================================

/**
 * Last 20 audit events for a bug, with each actor resolved to a
 * display name and for assignee_changed events the old + new
 * assignee user ids resolved to names too.
 */
export async function getActivity(bugId: number) {
  const db = database();
  const events = await db
    .select()
    .from(auditEvents)
    .where(eq(auditEvents.bugId, bugId))
    .orderBy(desc(auditEvents.createdAt))
    .limit(20);

  const userIds = new Set<string>(events.map((e) => e.actorId));
  for (const e of events) {
    if (e.eventType === "assignee_changed") {
      if (e.oldValue) userIds.add(e.oldValue);
      if (e.newValue) userIds.add(e.newValue);
    }
  }
  const userRows = await fetchUsersByIds(db, Array.from(userIds));
  const userById = new Map(userRows.map((u) => [u.id, u]));

  return events.map((e) => ({
    ...e,
    actor: userById.get(e.actorId) ?? null,
    oldAssigneeName:
      e.eventType === "assignee_changed" && e.oldValue
        ? (userById.get(e.oldValue)?.name ?? null)
        : null,
    newAssigneeName:
      e.eventType === "assignee_changed" && e.newValue
        ? (userById.get(e.newValue)?.name ?? null)
        : null,
  }));
}
