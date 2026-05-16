import { sql } from "drizzle-orm";
import {
  bigserial,
  check,
  foreignKey,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

// =============================================================================
// Enums 
// =============================================================================

export const userRoleEnum = pgEnum("user_role", ["reporter", "sde", "admin"]);
export const bugStatusEnum = pgEnum("bug_status", [
  "new",
  "triaged",
  "in_progress",
  "in_review",
  "resolved",
  "closed",
]);

export const bugPriorityEnum = pgEnum("bug_priority", [
  "p0",
  "p1",
  "p2",
  "p3",
  "p4",
]);

export const bugSeverityEnum = pgEnum("bug_severity", [
  "sev1",
  "sev2",
  "sev3",
  "sev4",
]);

export const auditEventTypeEnum = pgEnum("audit_event_type", [
  "bug_created",
  "status_changed",
  "priority_changed",
  "severity_changed",
  "assignee_changed",
  "comment_added",
  "comment_edited",
  "comment_deleted",
  "bug_deleted",
  "role_changed",
]);

// =============================================================================
// users - Application users (reporters, sdes, admins)
// =============================================================================

export const users = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    email: text("email").notNull().unique(),
    name: text("name").notNull(),
    displayName: text("display_name"),
    role: userRoleEnum("role").notNull().default("reporter"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    check(
      "users_name_length",
      sql`char_length(${table.name}) BETWEEN 1 AND 100`,
    ),
  ],
);

// =============================================================================
// bugs - Display structure: BUG-0001, BUG-1234 etc.
// =============================================================================

export const bugs = pgTable(
  "bugs",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    status: bugStatusEnum("status").notNull().default("new"),
    priority: bugPriorityEnum("priority").notNull().default("p3"),
    severity: bugSeverityEnum("severity").notNull().default("sev3"),
    reporterId: text("reporter_id")
      .notNull()
      .references(() => users.id, { onDelete: "no action" }),
    assigneeId: text("assignee_id").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    check(
      "bugs_closed_at_iff_closed",
      sql`(${table.status} = 'closed') = (${table.closedAt} IS NOT NULL)`,
    ),
    check(
      "bugs_title_length",
      sql`char_length(${table.title}) BETWEEN 1 AND 200`,
    ),
    check(
      "bugs_description_length",
      sql`char_length(${table.description}) BETWEEN 1 AND 10000`,
    ),
    index("bugs_status_idx").on(table.status),
    index("bugs_assignee_idx").on(table.assigneeId),
    index("bugs_reporter_idx").on(table.reporterId),
    // Triage-queue ordering: open bugs by priority.
    index("bugs_status_priority_idx").on(table.status, table.priority),
  ],
);

// =============================================================================
// comments
// =============================================================================

export const comments = pgTable(
  "comments",
  {
    id: text("id")
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    bugId: integer("bug_id")
      .notNull()
      .references(() => bugs.id, { onDelete: "cascade" }),
    authorId: text("author_id")
      .notNull()
      .references(() => users.id, { onDelete: "no action" }),
    body: text("body").notNull(),
    parentId: text("parent_id"), 
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (table) => [
    check(
      "comments_body_length",
      sql`char_length(${table.body}) BETWEEN 1 AND 10000`,
    ),
    foreignKey({
      columns: [table.parentId],
      foreignColumns: [table.id],
      name: "comments_parent_id_comments_id_fk",
    }).onDelete("set null"),
    index("comments_bug_idx").on(table.bugId),
    index("comments_parent_idx").on(table.parentId),
  ],
);

// =============================================================================
// audit_events - Application code never UPDATEs or DELETEs this table.
// =============================================================================

export const auditEvents = pgTable(
  "audit_events",
  {
    id: bigserial("id", { mode: "number" }).primaryKey(),
    bugId: integer("bug_id")
      .notNull()
      .references(() => bugs.id, { onDelete: "no action" }),
    actorId: text("actor_id")
      .notNull()
      .references(() => users.id, { onDelete: "no action" }),
    eventType: auditEventTypeEnum("event_type").notNull(),
    field: text("field"),
    oldValue: text("old_value"),
    newValue: text("new_value"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("audit_events_bug_idx").on(table.bugId),
    index("audit_events_actor_idx").on(table.actorId),
    index("audit_events_created_at_idx").on(table.createdAt),
    index("audit_events_type_idx").on(table.eventType),
  ],
);

// =============================================================================
// Type exports - convenienve types for loaders/actions
// =============================================================================

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Bug = typeof bugs.$inferSelect;
export type NewBug = typeof bugs.$inferInsert;
export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;
export type AuditEvent = typeof auditEvents.$inferSelect;
export type NewAuditEvent = typeof auditEvents.$inferInsert;
