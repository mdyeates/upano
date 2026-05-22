import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Spinner } from "~/components/ui/spinner";
import { initials } from "~/lib/utils";

/**
 * Comment representing a not-yet-saved
 * mutation (skeleton with submitted value).
 *
 * It is replaced by the real comment once the loader revalidates.
 */
export function OptimisticCommentItem({
  body,
  authorName,
}: {
  body: string;
  authorName: string;
}) {
  return (
    <li className="flex items-start gap-3 text-sm opacity-70">
      <Avatar className="size-8 shrink-0">
        <AvatarFallback className="text-xs">
          {initials(authorName)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{authorName}</span>
          <span className="inline-flex items-center gap-1 italic">
            <Spinner className="size-3" />
            sending
          </span>
        </div>
        <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed">
          {body}
        </p>
      </div>
    </li>
  );
}
