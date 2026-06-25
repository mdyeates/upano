import { and, eq, isNull, or, sql } from "drizzle-orm";
import { database } from "~/database/context";
import { auditEvents, bugs, comments, type User } from "~/database/schema";
import { fetchUsersByIds } from "~/lib/auth/user.service";

import { ForbiddenError, NotFoundError, ValidationError } from "./_errors";

function validateBody(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (trimmed.length === 0) return null;
  if (trimmed.length > 1000) return null;
  return trimmed;
}

// =============================================================================
// Add a comment
// =============================================================================

export async function add({
  bugId,
  rawBody,
  actorId,
}: {
  bugId: number;
  rawBody: unknown;
  actorId: string;
}): Promise<{ commentId: string }> {
  const body = validateBody(rawBody);
  if (!body) {
    throw new ValidationError("Comment body must be 1-1000 characters", "body");
  }

  const db = database();

  const bugRows = await db
    .select({ id: bugs.id })
    .from(bugs)
    .where(and(eq(bugs.id, bugId), isNull(bugs.deletedAt)))
    .limit(1);
  if (!bugRows[0]) {
    throw new NotFoundError("Bug not found");
  }

  const newId = await db.transaction(async (tx) => {
    const inserted = await tx
      .insert(comments)
      .values({ bugId, authorId: actorId, body })
      .returning({ id: comments.id });
    await tx.insert(auditEvents).values({
      bugId,
      actorId,
      eventType: "comment_added",
      metadata: { commentId: inserted[0].id },
    });
    return inserted[0].id;
  });

  return { commentId: newId };
}

// =============================================================================
// Edit a comment (revision pattern)
// =============================================================================

export async function edit({
  bugId,
  commentId,
  rawBody,
  actorId,
  actorRole,
}: {
  bugId: number;
  commentId: unknown;
  rawBody: unknown;
  actorId: string;
  actorRole: User["role"];
}): Promise<{ commentId: string }> {
  if (typeof commentId !== "string" || !commentId) {
    throw new ValidationError("Missing commentId", "commentId");
  }
  const body = validateBody(rawBody);
  if (!body) {
    throw new ValidationError("Comment body must be 1-1000 characters", "body");
  }

  const db = database();

  const existing = await db
    .select()
    .from(comments)
    .where(eq(comments.id, commentId))
    .limit(1);

  const original = existing[0];
  if (!original || original.bugId !== bugId) {
    throw new NotFoundError("Comment not found");
  }

  const isAuthor = original.authorId === actorId;
  const isAdmin = actorRole === "admin";
  if (!isAuthor && !isAdmin) {
    throw new ForbiddenError("You can only edit your own comments");
  }

  // Edit-as-revision: new row's parent_id points at the conversation
  // root (the original or its existing parent_id).
  const rootId = original.parentId ?? original.id;

  const newId = await db.transaction(async (tx) => {
    const inserted = await tx
      .insert(comments)
      .values({
        bugId,
        authorId: actorId,
        body,
        parentId: rootId,
      })
      .returning({ id: comments.id });
    await tx.insert(auditEvents).values({
      bugId,
      actorId,
      eventType: "comment_edited",
      metadata: { commentId: inserted[0].id, originalId: rootId },
    });
    return inserted[0].id;
  });

  return { commentId: newId };
}

// =============================================================================
// Delete a comment (soft)
// =============================================================================

export async function remove({
  bugId,
  commentId,
  actorId,
  actorRole,
}: {
  bugId: number;
  commentId: unknown;
  actorId: string;
  actorRole: User["role"];
}): Promise<void> {
  if (typeof commentId !== "string" || !commentId) {
    throw new ValidationError("Missing commentId", "commentId");
  }

  const db = database();

  const existing = await db
    .select()
    .from(comments)
    .where(eq(comments.id, commentId))
    .limit(1);
  const original = existing[0];
  if (!original || original.bugId !== bugId) {
    throw new NotFoundError("Comment not found");
  }

  const isAuthor = original.authorId === actorId;
  const isAdmin = actorRole === "admin";
  if (!isAuthor && !isAdmin) {
    throw new ForbiddenError("You can only delete your own comments");
  }

  const rootId = original.parentId ?? original.id;

  await db.transaction(async (tx) => {
    await tx
      .update(comments)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(comments.bugId, bugId),
          isNull(comments.deletedAt),
          or(eq(comments.id, rootId), eq(comments.parentId, rootId)),
        ),
      );
    await tx.insert(auditEvents).values({
      bugId,
      actorId,
      eventType: "comment_deleted",
      metadata: { commentId, rootId },
    });
  });
}

// =============================================================================
// Loader-side: list comments for a bug
// =============================================================================

/**
 * Latest revision of every conversation on a bug, with each author
 * resolved to display data via fetchUsersByIds.
 */
export async function list(bugId: number) {
  const db = database();
  const commentRows = await db.execute<{
    id: string;
    bug_id: number;
    author_id: string;
    body: string;
    parent_id: string | null;
    created_at: Date;
    deleted_at: Date | null;
  }>(sql`
    SELECT * FROM (
      SELECT DISTINCT ON (COALESCE(parent_id, id))
        id, bug_id, author_id, body, parent_id, created_at, deleted_at
      FROM ${comments}
      WHERE bug_id = ${bugId} AND deleted_at IS NULL
      ORDER BY COALESCE(parent_id, id), created_at DESC
    ) AS latest
    ORDER BY created_at ASC
  `);

  const authorIds = Array.from(new Set(commentRows.map((c) => c.author_id)));
  const authors = await fetchUsersByIds(db, authorIds);
  const authorById = new Map(authors.map((u) => [u.id, u]));

  return commentRows.map((c) => ({
    id: c.id,
    body: c.body,
    parentId: c.parent_id,
    authorId: c.author_id,
    author: authorById.get(c.author_id) ?? null,
    createdAt: c.created_at,
    isEdited: c.parent_id !== null,
  }));
}
