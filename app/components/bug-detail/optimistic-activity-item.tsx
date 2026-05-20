import { formatDistanceToNow } from "date-fns";

import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import type { AuditEvent } from "~/database/schema";

import { describeEvent, type OptimisticEvent } from "~/lib/utils/optimistic";
import { initials } from "~/lib/utils";

/**
 * Activity timeline row representing an not-yet-saved
 * mutation (skeleton with submitted value).
 * 
 * It is replaced by the real item once the loader revalidates.
 */
export function OptimisticActivityItem({ event }: { event: OptimisticEvent }) {
  const when = formatDistanceToNow(event.createdAt, { addSuffix: true });
  const description = describeEvent(event as unknown as AuditEvent);
  return (
    <li className="flex items-start gap-3 text-sm opacity-70">
      <Avatar className="size-7 shrink-0">
        <AvatarFallback className="text-xs">
          {initials(event.actorName)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 leading-snug">
        <span className="font-medium">{event.actorName}</span> {description}{" "}
        <span className="text-muted-foreground">
          · {when} · <span className="italic">in progress</span>
        </span>
      </div>
    </li>
  );
}
