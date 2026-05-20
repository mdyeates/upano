import type { useFetchers } from "react-router";
import type { AuditEvent } from "~/database/schema";

export type OptimisticEvent = {
  id: string; // synthetic, fetcher.key prefixed
  eventType: AuditEvent["eventType"];
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: Date;
  actorName: string;
  oldAssigneeName?: string | null;
  newAssigneeName?: string | null;
};

/**
 * Build a list of optimistic events based on the current
 * fetchers' formData. Skips fetchers with errors.
 */
export function buildOptimisticEvents({
  fetchers,
  bug,
  currentUserId,
  currentUserName,
}: {
  fetchers: ReturnType<typeof useFetchers>;
  bug: {
    status: string;
    assigneeId: string | null;
    title: string;
    description: string;
  };
  currentUserId: string;
  currentUserName: string;
}): OptimisticEvent[] {
  const out: OptimisticEvent[] = [];

  for (const f of fetchers) {
    if (f.state === "idle") continue;
    if (!f.formData) continue;
    // Skip fetchers that already have an error response.
    if (
      f.data &&
      typeof f.data === "object" &&
      "ok" in f.data &&
      f.data.ok === false
    ) {
      continue;
    }

    const intent = f.formData.get("intent");
    const baseId = `optimistic-${f.key}`;
    const now = new Date();

    if (intent === "change-status") {
      const to = f.formData.get("to");
      if (typeof to !== "string") continue;
      out.push({
        id: baseId,
        eventType: "status_changed",
        field: "status",
        oldValue: bug.status,
        newValue: to,
        createdAt: now,
        actorName: currentUserName,
      });
    } else if (intent === "change-assignee") {
      // Skipped on purpose. The picker's own
      // spinner gives feedback in the meantime.
      continue;
    } else if (intent === "edit-title") {
      const newTitle = f.formData.get("title");
      if (typeof newTitle !== "string") continue;
      out.push({
        id: baseId,
        eventType: "title_changed",
        field: "title",
        oldValue: bug.title,
        newValue: newTitle.trim(),
        createdAt: now,
        actorName: currentUserName,
      });
    } else if (intent === "edit-description") {
      const newDescription = f.formData.get("description");
      if (typeof newDescription !== "string") continue;
      out.push({
        id: baseId,
        eventType: "description_changed",
        field: "description",
        oldValue: null,
        newValue: null,
        createdAt: now,
        actorName: currentUserName,
      });
    } else if (intent === "add-comment") {
      out.push({
        id: baseId,
        eventType: "comment_added",
        field: null,
        oldValue: null,
        newValue: null,
        createdAt: now,
        actorName: currentUserName,
      });
    } else if (intent === "edit-comment") {
      out.push({
        id: baseId,
        eventType: "comment_edited",
        field: null,
        oldValue: null,
        newValue: null,
        createdAt: now,
        actorName: currentUserName,
      });
    } else if (intent === "delete-comment") {
      out.push({
        id: baseId,
        eventType: "comment_deleted",
        field: null,
        oldValue: null,
        newValue: null,
        createdAt: now,
        actorName: currentUserName,
      });
    }
    void currentUserId;
  }

  return out;
}

/**
 * Describe an event in the format "username [action]"
 * e.g. "john changed status from open to closed"
 */
export function describeEvent(
  event: AuditEvent & {
    oldAssigneeName?: string | null;
    newAssigneeName?: string | null;
  },
): string {
  switch (event.eventType) {
    case "bug_created":
      return "filed this bug";
    case "status_changed":
      return `changed status from ${event.oldValue ?? "(none)"} to ${event.newValue ?? "(none)"}`;
    case "priority_changed":
      return `changed priority from ${event.oldValue ?? "(none)"} to ${event.newValue ?? "(none)"}`;
    case "severity_changed":
      return `changed severity from ${event.oldValue ?? "(none)"} to ${event.newValue ?? "(none)"}`;
    case "title_changed":
      return "edited the title";
    case "description_changed":
      return "edited the description";
    case "assignee_changed": {
      // Prefer pre-resolved display names. Fall back to the raw uuid.
      const renderId = (id: string) => `user ${id.slice(0, 8)}`;
      const oldLabel = event.oldValue
        ? (event.oldAssigneeName ?? renderId(event.oldValue))
        : null;
      const newLabel = event.newValue
        ? (event.newAssigneeName ?? renderId(event.newValue))
        : null;
      if (oldLabel && newLabel) {
        return `reassigned from ${oldLabel} to ${newLabel}`;
      }
      if (oldLabel && !newLabel) {
        return `unassigned ${oldLabel}`;
      }
      if (!oldLabel && newLabel) {
        return `assigned this to ${newLabel}`;
      }
      return "changed assignee";
    }
    case "comment_added":
      return "commented";
    case "comment_edited":
      return "edited a comment";
    case "comment_deleted":
      return "deleted a comment";
    case "bug_deleted":
      return "deleted this bug";
    case "role_changed":
      return `changed role from ${event.oldValue ?? "(none)"} to ${event.newValue ?? "(none)"}`;
    default:
      return "made a change";
  }
}
