import { eq, count, and, isNull, sql, gte, desc } from "drizzle-orm";
import { database } from "~/database/context";
import { auditEvents, bugs, type User } from "~/database/schema";
import { resolveAuditActors } from "~/lib/auth/audit.server";

/**
 * Reporters see KPIs scoped to bugs they filed;
 * SDEs and Admins see org-wide. The `myQueueCount` is always
 * scoped to the current user (regardless of role).
 */
export async function getKpis(localUser: User) {
  const db = database();
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const reporterScope =
    localUser.role === "reporter"
      ? eq(bugs.reporterId, localUser.id)
      : undefined;

  const [openCount, urgentCount, myQueueCount, closedThisWeek] =
    await Promise.all([
      db
        .select({ n: count() })
        .from(bugs)
        .where(
          and(
            isNull(bugs.deletedAt),
            reporterScope,
            sql`${bugs.status} NOT IN ('resolved', 'closed')`,
          ),
        ),
      db
        .select({ n: count() })
        .from(bugs)
        .where(
          and(
            isNull(bugs.deletedAt),
            reporterScope,
            sql`${bugs.status} NOT IN ('resolved', 'closed')`,
            sql`${bugs.priority} IN ('p0', 'p1')`,
          ),
        ),
      db
        .select({ n: count() })
        .from(bugs)
        .where(
          and(
            isNull(bugs.deletedAt),
            eq(bugs.assigneeId, localUser.id),
            sql`${bugs.status} NOT IN ('resolved', 'closed')`,
          ),
        ),
      db
        .select({ n: count() })
        .from(bugs)
        .where(
          and(
            isNull(bugs.deletedAt),
            reporterScope,
            eq(bugs.status, "closed"),
            gte(bugs.closedAt, oneWeekAgo),
          ),
        ),
    ]);

  return {
    openCount: openCount[0]?.n ?? 0,
    urgentCount: urgentCount[0]?.n ?? 0,
    myQueueCount: myQueueCount[0]?.n ?? 0,
    closedThisWeek: closedThisWeek[0]?.n ?? 0,
  };
}

/**
 * Top 10 bugs assigned to the current user that aren't resolved or
 * closed. Sorted by priority then most recent update.
 */
export async function getMyQueue(localUser: User) {
  const db = database();
  return db
    .select({ bug: bugs })
    .from(bugs)
    .where(
      and(
        isNull(bugs.deletedAt),
        eq(bugs.assigneeId, localUser.id),
        sql`${bugs.status} NOT IN ('resolved', 'closed')`,
      ),
    )
    .orderBy(bugs.priority, desc(bugs.updatedAt))
    .limit(10)
    .then((rows) => rows.map((r) => r.bug));
}

/**
 * Last 10 audit events on bugs visible to the current user. Reporter
 * scoping mirrors getKpiCounts. The inner join filters out events
 * with NULL bug_id (e.g. role_changed events from the admin page).
 */
export async function getRecentActivity(localUser: User) {
  const db = database();
  const reporterScope =
    localUser.role === "reporter"
      ? eq(bugs.reporterId, localUser.id)
      : undefined;

  const events = await db
    .select({
      id: auditEvents.id,
      bugId: bugs.id,
      actorId: auditEvents.actorId,
      eventType: auditEvents.eventType,
      field: auditEvents.field,
      oldValue: auditEvents.oldValue,
      newValue: auditEvents.newValue,
      metadata: auditEvents.metadata,
      createdAt: auditEvents.createdAt,
      bugTitle: bugs.title,
    })
    .from(auditEvents)
    .innerJoin(bugs, eq(bugs.id, auditEvents.bugId))
    .where(and(isNull(bugs.deletedAt), reporterScope))
    .orderBy(desc(auditEvents.createdAt))
    .limit(10);

  if (events.length === 0) return [];

  const actorIds = Array.from(new Set(events.map((e) => e.actorId)));
  const actorById = await resolveAuditActors(db, actorIds);

  return events.map((row) => ({
    ...row,
    actor: actorById.get(row.actorId) ?? null,
  }));
}
