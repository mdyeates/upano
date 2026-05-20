import { useState } from "react";
import { useFetcher } from "react-router";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { Textarea } from "~/components/ui/textarea";
import { useActionToast } from "~/lib/hooks/use-action-toast";
import { cn, initials } from "~/lib/utils/utils";
import type { action as bugDetailAction } from "~/routes/bug-detail";

export type CommentAuthor = {
  id: string;
  name: string;
  displayName: string | null;
};

export type CommentRow = {
  id: string;
  body: string;
  parentId: string | null;
  authorId: string;
  author: CommentAuthor | null;
  createdAt: Date | string;
  isEdited: boolean;
};

/**
 * One comment in the thread.
 */
export function CommentItem({
  comment,
  currentUserId,
  currentUserRole,
}: {
  comment: CommentRow;
  currentUserId: string;
  currentUserRole: "reporter" | "sde" | "admin";
}) {
  const [editing, setEditing] = useState(false);
  const editFetcher = useFetcher<typeof bugDetailAction>();
  const deleteFetcher = useFetcher<typeof bugDetailAction>();

  useActionToast(editFetcher, {
    success: "Comment edited.",
    noopMessage: null,
  });
  useActionToast(deleteFetcher, {
    success: "Comment deleted.",
  });

  const isAuthor = comment.authorId === currentUserId;
  const isAdmin = currentUserRole === "admin";
  const canEdit = isAuthor;
  const canDelete = isAuthor || isAdmin;

  // for readability.
  const editingNow = editFetcher.state !== "idle";
  const deletingNow = deleteFetcher.state !== "idle";

  const optimisticBody =
    editingNow && editFetcher.formData?.get("intent") === "edit-comment"
      ? (editFetcher.formData.get("body") as string | null)
      : null;
  const displayBody = optimisticBody ?? comment.body;

  const who = comment.author?.displayName ?? comment.author?.name ?? "Someone";
  const when = formatDistanceToNow(new Date(comment.createdAt), {
    addSuffix: true,
  });

  return (
    <li
      className={cn(
        "flex items-start gap-3 text-sm",
        deletingNow && "opacity-40 line-through",
      )}
    >
      <Avatar className="size-8 shrink-0">
        <AvatarFallback className="text-xs">
          {comment.author ? initials(comment.author.name) : "?"}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">{who}</span>
          <span>{when}</span>
          {comment.isEdited && <span className="italic">(edited)</span>}
          {optimisticBody && (
            <span className="inline-flex items-center gap-1 italic">
              <Spinner className="size-3" />
              updating
            </span>
          )}
        </div>

        {editing ? (
          <editFetcher.Form
            method="post"
            noValidate
            className="mt-2"
            onSubmit={() => setEditing(false)}
          >
            <input type="hidden" name="intent" value="edit-comment" />
            <input type="hidden" name="commentId" value={comment.id} />
            <Textarea
              name="body"
              defaultValue={comment.body}
              className="min-h-[60px]"
              maxLength={1000}
              required
            />
            <div className="mt-2 flex gap-2">
              <Button type="submit" size="sm" disabled={editingNow}>
                {editingNow ? "Saving…" : "Save"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setEditing(false)}
              >
                Cancel
              </Button>
            </div>
          </editFetcher.Form>
        ) : (
          <>
            <p className="mt-1 whitespace-pre-wrap break-words text-sm leading-relaxed">
              {displayBody}
            </p>
            {(canEdit || canDelete) && (
              <div className="mt-1 flex gap-2 text-xs text-muted-foreground">
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => setEditing(true)}
                    className="hover:text-foreground"
                  >
                    Edit
                  </button>
                )}
                {canDelete && (
                  <deleteFetcher.Form method="post" noValidate>
                    <input type="hidden" name="intent" value="delete-comment" />
                    <input type="hidden" name="commentId" value={comment.id} />
                    <button
                      type="submit"
                      className="hover:text-foreground disabled:opacity-50"
                      disabled={deletingNow}
                    >
                      {deletingNow ? (
                        <span className="inline-flex items-center gap-1">
                          <Spinner className="size-3" /> Deleting
                        </span>
                      ) : (
                        "Delete"
                      )}
                    </button>
                  </deleteFetcher.Form>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </li>
  );
}
