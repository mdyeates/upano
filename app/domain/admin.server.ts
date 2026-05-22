import { eq, desc } from "drizzle-orm";
import { database } from "~/database/context";
import { auditEvents, users, type User } from "~/database/schema";
import { invalidateLocalUserCache } from "~/lib/auth/upsert-user.server";
import { resolveAuditActors } from "~/lib/auth/audit.server";
import {
  listAllUsersWithIdentity,
  type UserWithIdentity,
} from "~/lib/auth/user.service";

import { ForbiddenError, NotFoundError, SelfDemotionError } from "./_errors";

// =============================================================================
// Loader-side reads
// =============================================================================

export function listUsers(): Promise<UserWithIdentity[]> {
  // Thin wrapper over the query primitive in lib/db/queries.server.
  // Surfaces the read under a domain-named alias for the admin route.
  return listAllUsersWithIdentity(database());
}

/**
 * Latest 20 role-change audit events with both actor and target users
 * resolved to display names via the cross-schema users + neon_auth.user
 * join.
 */
export async function listRecentRoleChanges() {
  const db = database();
  const rows = await db
    .select({
      id: auditEvents.id,
      actorId: auditEvents.actorId,
      oldValue: auditEvents.oldValue,
      newValue: auditEvents.newValue,
      metadata: auditEvents.metadata,
      createdAt: auditEvents.createdAt,
    })
    .from(auditEvents)
    .where(eq(auditEvents.eventType, "role_changed"))
    .orderBy(desc(auditEvents.createdAt))
    .limit(20);

  if (rows.length === 0) return [];

  const targetIds = rows
    .map((r) => {
      const meta = r.metadata as { targetUserId?: string } | null;
      return meta?.targetUserId;
    })
    .filter((id): id is string => Boolean(id));

  const involvedIds = Array.from(
    new Set([...rows.map((r) => r.actorId), ...targetIds]),
  );

  const byId = await resolveAuditActors(db, involvedIds);

  return rows.map((r) => {
    const meta = r.metadata as { targetUserId?: string } | null;
    const targetId = meta?.targetUserId ?? null;
    return {
      id: r.id,
      actor: byId.get(r.actorId) ?? null,
      target: targetId ? (byId.get(targetId) ?? null) : null,
      oldValue: r.oldValue,
      newValue: r.newValue,
      createdAt: r.createdAt,
    };
  });
}

// =============================================================================
// Action-side: change a user's role
// =============================================================================

/**
 * Authorisation + business rules for changing a user's role.
 */
export async function changeRole({
  actorRole,
  actorId,
  targetUserId,
  newRole,
}: {
  actorRole: User["role"];
  actorId: string;
  targetUserId: string;
  newRole: "reporter" | "sde" | "admin";
}): Promise<{ noop: boolean; role: User["role"] }> {
  if (actorRole !== "admin") {
    throw new ForbiddenError();
  }

  // Self-demotion guard. An admin cannot change their own role away
  // from admin via this UI. Forces deliberate intent and prevents
  // accidental lockout of admin role.
  if (targetUserId === actorId && newRole !== "admin") {
    throw new SelfDemotionError();
  }

  const db = database();

  const target = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.id, targetUserId))
    .limit(1);

  if (!target[0]) {
    throw new NotFoundError("User not found");
  }

  if (target[0].role === newRole) {
    return { noop: true, role: newRole };
  }

  const oldRole = target[0].role;

  await db.transaction(async (tx) => {
    await tx
      .update(users)
      .set({ role: newRole })
      .where(eq(users.id, targetUserId));
    await tx.insert(auditEvents).values({
      bugId: null,
      actorId,
      eventType: "role_changed",
      field: "role",
      oldValue: oldRole,
      newValue: newRole,
      metadata: { targetUserId },
    });
  });

  invalidateLocalUserCache(targetUserId);

  return { noop: false, role: newRole };
}
