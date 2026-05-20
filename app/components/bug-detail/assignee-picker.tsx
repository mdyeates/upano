import { Suspense } from "react";
import { Await, useFetcher } from "react-router";

import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Skeleton } from "~/components/ui/skeleton";
import { Spinner } from "~/components/ui/spinner";
import { useActionToast } from "~/lib/hooks/use-action-toast";
import { initials } from "~/lib/utils";

import type { action as bugDetailAction } from "~/routes/bug-detail";

export type AssigneeDisplay = {
  id: string;
  name: string;
  displayName: string | null;
};

export function AssigneePicker({
  currentAssignee,
  assigneesPromise,
  canChange,
}: {
  currentAssignee: AssigneeDisplay | null;
  assigneesPromise: Promise<
    Array<{ id: string; name: string; role: "sde" | "admin" }>
  >;
  canChange: boolean;
}) {
  const fetcher = useFetcher<typeof bugDetailAction>();
  const submitting = fetcher.state !== "idle";
  const error =
    fetcher.data && "ok" in fetcher.data && fetcher.data.ok === false
      ? fetcher.data.error
      : null;

  useActionToast(fetcher, {
    success: "Assignee updated.",
    noopMessage: "Assignment change failed.",
  });

  const display = currentAssignee ? (
    // Show the current assignee
    <div className="flex items-center gap-2">
      <Avatar className="size-8">
        <AvatarFallback>{initials(currentAssignee.name)}</AvatarFallback>
      </Avatar>
      <span className="text-sm">
        {currentAssignee.displayName ?? currentAssignee.name}
      </span>
    </div>
  ) : (
    // Fallback to unassigned
    <span className="text-sm italic text-muted-foreground">Unassigned</span>
  );

  if (!canChange) {
    return <div className="mt-2">{display}</div>;
  }

  const onValueChange = (next: string) => {
    const form = new FormData();
    form.set("intent", "change-assignee");
    form.set("assigneeId", next === "__unassigned__" ? "" : next);
    fetcher.submit(form, { method: "post" });
  };

  const currentValue = currentAssignee?.id ?? "__unassigned__";

  return (
    <div className="mt-2 space-y-2">
      {display}
      <Suspense fallback={<Skeleton className="h-9 w-full" />}>
        <Await resolve={assigneesPromise}>
          {(assignees) => (
            <div className="flex items-center gap-2">
              <Select
                value={currentValue}
                onValueChange={onValueChange}
                disabled={submitting}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue
                    placeholder={submitting ? "Reassigning…" : "Reassign…"}
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__unassigned__">Unassigned</SelectItem>
                  {assignees.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name}
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({u.role.toUpperCase()})
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {submitting && (
                <Spinner
                  className="size-4 shrink-0 text-muted-foreground"
                  aria-label="Reassigning"
                />
              )}
            </div>
          )}
        </Await>
      </Suspense>
      {error && (
        <p role="alert" className="text-xs text-rose-700 dark:text-rose-300">
          {error}
        </p>
      )}
    </div>
  );
}
