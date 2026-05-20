import { formatDistanceToNow } from "date-fns";

import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import type { AuditEvent } from "~/database/schema";

import { describeEvent } from "~/lib/utils/optimistic";
import { initials } from "~/lib/utils";

export type ActivityActor = {
  id: string;
  name: string;
  displayName: string | null;
};

/**
 * One row in the bug-detail activity timeline. Renders an avatar +
 * "<who> <action sentence> <when>" line.
 */
export function ActivityItem({
  event,
}: {
  event: AuditEvent & {
    actor: ActivityActor | null;
    oldAssigneeName?: string | null;
    newAssigneeName?: string | null;
  };
}) {
  const who = event.actor?.displayName ?? event.actor?.name ?? "Someone";
  const when = formatDistanceToNow(new Date(event.createdAt), {
    addSuffix: true,
  });
  return (
    <li className="flex items-start gap-3 text-sm">
      <Avatar className="size-7">
        <AvatarFallback className="text-xs">
          {event.actor ? initials(event.actor.name) : "?"}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 leading-snug">
        <span className="font-medium">{who}</span> {describeEvent(event)}{" "}
        <span className="text-muted-foreground">· {when}</span>
      </div>
    </li>
  );
}
