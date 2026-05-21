import { formatDistanceToNow } from "date-fns";
import { Suspense, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  Await,
  data,
  useFetcher,
  useFetchers,
  useRouteLoaderData,
  useSearchParams,
} from "react-router";

import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { AppShell } from "~/components/app-shell";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Pill } from "~/components/kibo-ui/pill";
import { Separator } from "~/components/ui/separator";
import { Skeleton } from "~/components/ui/skeleton";
import { Textarea } from "~/components/ui/textarea";
import { database } from "~/database/context";
import { type Bug } from "~/database/schema";
import { getLocalUser } from "~/lib/auth/auth-middleware.server";
import * as Bugs from "~/domain/bugs.server";
import * as Comments from "~/domain/comments.server";
import { domainErrorToResponse } from "~/domain/_response";
import { NotFoundError } from "~/domain/_errors";
import { listAssignableUsers } from "~/lib/auth/user.service";
import { useActionToast } from "~/lib/hooks/use-action-toast";

import { AssigneePicker } from "~/components/bug-detail/assignee-picker";
import { ActivityItem } from "~/components/bug-detail/activity-item";
import { CommentItem } from "~/components/bug-detail/comment-item";
import { InlineEditField } from "~/components/bug-detail/inline-edit-field";
import { OptimisticActivityItem } from "~/components/bug-detail/optimistic-activity-item";
import { OptimisticCommentItem } from "~/components/bug-detail/optimistic-comment-item";
import { buildOptimisticEvents } from "~/lib/utils/optimistic";
import {
  allowedTransitionsFor,
  type BugStatus,
} from "~/lib/stateMachine/stateMachine";

import type { Route } from "./+types/bug-detail";
import type { loader as authedLoader } from "./_authed";
import { formatBugId, initials } from "~/lib/utils";

export function meta({ data }: Route.MetaArgs) {
  if (!data?.bug) {
    return [{ title: "Bug not found — Upano" }];
  }
  return [{ title: `${formatBugId(data.bug.id)} — ${data.bug.title} — Upano` }];
}

export async function loader({ context, params }: Route.LoaderArgs) {
  const id = Number(params.id);
  if (!Number.isFinite(id) || id <= 0) {
    throw data({ message: "Invalid bug id" }, { status: 400 });
  }

  const localUser = getLocalUser(context);
  const db = database();

  let bug;
  try {
    bug = await Bugs.getBugForViewer({
      bugId: id,
      actorRole: localUser.role,
      actorId: localUser.id,
    });
  } catch (err) {
    if (err instanceof NotFoundError) {
      throw data({ message: "Bug not found" }, { status: 404 });
    }
    throw err;
  }

  const headerUsersPromise = Bugs.getHeaderUsers(bug);
  const activityPromise = Bugs.getActivity(id);
  const commentsPromise = Comments.list(id);

  const assigneesPromise: Promise<
    Array<{ id: string; name: string; role: "sde" | "admin" }>
  > =
    localUser.role !== "sde" && localUser.role !== "admin"
      ? Promise.resolve([])
      : listAssignableUsers(db);

  return {
    bug,
    headerUsersPromise,
    activityPromise,
    commentsPromise,
    assigneesPromise,
    allowedTransitions: allowedTransitionsFor(bug.status, localUser.role),
    canEditBugFields:
      localUser.role === "sde" ||
      localUser.role === "admin" ||
      bug.reporterId === localUser.id,
  };
}

// =============================================================================
// Action: status changes
// =============================================================================

export async function action({ context, params, request }: Route.ActionArgs) {
  const id = Number(params.id);
  if (!Number.isFinite(id) || id <= 0) {
    return data(
      { ok: false as const, error: "Invalid bug id" },
      { status: 400 },
    );
  }

  const formData = await request.formData();
  const intent = formData.get("intent");
  const localUser = getLocalUser(context);

  try {
    await Bugs.requireReporterOwnership({
      bugId: id,
      actorRole: localUser.role,
      actorId: localUser.id,
    });
  } catch (err) {
    const resp = domainErrorToResponse(err);
    if (resp) return resp;
    throw err;
  }

  try {
    switch (intent) {
      case "change-status": {
        const result = await Bugs.changeStatus({
          bugId: id,
          toStatus: formData.get("to"),
          actorId: localUser.id,
          actorRole: localUser.role,
        });
        return data({ ok: true as const, status: result.status });
      }
      case "change-assignee": {
        const result = await Bugs.changeAssignee({
          bugId: id,
          rawAssigneeId: formData.get("assigneeId"),
          actorId: localUser.id,
          actorRole: localUser.role,
        });
        return data({
          ok: true as const,
          ...(result.noop ? { noop: true } : {}),
        });
      }
      case "edit-title": {
        const result = await Bugs.editField({
          bugId: id,
          field: "title",
          rawValue: formData.get("title"),
          actorId: localUser.id,
          actorRole: localUser.role,
        });
        return data({
          ok: true as const,
          ...(result.noop ? { noop: true } : {}),
        });
      }
      case "edit-description": {
        const result = await Bugs.editField({
          bugId: id,
          field: "description",
          rawValue: formData.get("description"),
          actorId: localUser.id,
          actorRole: localUser.role,
        });
        return data({
          ok: true as const,
          ...(result.noop ? { noop: true } : {}),
        });
      }
      case "add-comment": {
        const result = await Comments.add({
          bugId: id,
          rawBody: formData.get("body"),
          actorId: localUser.id,
        });
        return data({ ok: true as const, commentId: result.commentId });
      }
      case "edit-comment": {
        const result = await Comments.edit({
          bugId: id,
          commentId: formData.get("commentId"),
          rawBody: formData.get("body"),
          actorId: localUser.id,
          actorRole: localUser.role,
        });
        return data({ ok: true as const, commentId: result.commentId });
      }
      case "delete-comment": {
        await Comments.remove({
          bugId: id,
          commentId: formData.get("commentId"),
          actorId: localUser.id,
          actorRole: localUser.role,
        });
        return data({ ok: true as const });
      }
      default:
        return data(
          { ok: false as const, error: "Unknown intent" },
          { status: 400 },
        );
    }
  } catch (err) {
    const resp = domainErrorToResponse(err);
    if (resp) return resp;
    throw err;
  }
}

export default function BugDetail({ loaderData }: Route.ComponentProps) {
  const {
    bug,
    headerUsersPromise,
    activityPromise,
    commentsPromise,
    assigneesPromise,
    allowedTransitions,
    canEditBugFields,
  } = loaderData;
  const authed = useRouteLoaderData<typeof authedLoader>("routes/_authed")!;
  const { currentUserId, currentUserEmail, currentUserRole, currentUserName } =
    authed;
  const fetcher = useFetcher<typeof action>();
  const submitting = fetcher.state !== "idle";
  const submittingIntent = submitting
    ? (fetcher.formData?.get("intent") as string | null)
    : null;
  const submittingTo =
    submitting && submittingIntent === "change-status"
      ? (fetcher.formData?.get("to") as BugStatus | null)
      : null;

  useActionToast(fetcher, {
    success: (d) => {
      if ("status" in d && typeof d.status === "string") {
        return `Status → ${d.status.replaceAll("_", " ")}.`;
      }
      if ("commentId" in d) {
        return "Comment posted.";
      }
      if ("noop" in d) {
        return "Assignee updated.";
      }
      return "Saved.";
    },
  });

  const [searchParams, setSearchParams] = useSearchParams();
  const flashedCreatedRef = useRef(false);
 
  useEffect(() => {
    if (flashedCreatedRef.current) return;
    if (searchParams.get("created") !== "1") return;
    flashedCreatedRef.current = true;
    toast.success("Bug filed.");
    const next = new URLSearchParams(searchParams);
    next.delete("created");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);


  const allFetchers = useFetchers();
  const optimisticEvents = buildOptimisticEvents({
    fetchers: allFetchers,
    bug,
    currentUserId,
    currentUserName,
  });

  return (
    <AppShell current="bugs" email={currentUserEmail} role={currentUserRole}>
      {/* Title + ID */}
      <div className="mb-2 text-sm font-mono text-muted-foreground">
        {formatBugId(bug.id)}
      </div>
      <h1 className="heading-page">
        <InlineEditField
          intent="edit-title"
          field="title"
          value={bug.title}
          canEdit={canEditBugFields}
          multiline={false}
          ariaLabel="Bug title"
          renderValue={(v) => <span className="break-words">{v}</span>}
        />
      </h1>

      {/* Status / priority / severity row */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <StatusPill status={bug.status} />
        <Badge variant="outline">{priorityLabel(bug.priority)}</Badge>
        <Badge variant="outline">{severityLabel(bug.severity)}</Badge>
        <span className="text-sm text-muted-foreground">
          opened{" "}
          {formatDistanceToNow(new Date(bug.createdAt), { addSuffix: true })} ·
          updated{" "}
          {formatDistanceToNow(new Date(bug.updatedAt), { addSuffix: true })}
        </span>
      </div>

      <div className="mt-8 grid gap-8 md:grid-cols-[minmax(0,1fr)_280px]">
        {/* Main column — description, comments, activity stacked */}
        <div className="space-y-8">
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Description
            </h2>
            <div className="mt-2">
              <InlineEditField
                intent="edit-description"
                field="description"
                value={bug.description}
                canEdit={canEditBugFields}
                multiline
                ariaLabel="Bug description"
                renderValue={(v) => (
                  <div className="whitespace-pre-wrap break-words rounded-md border border-border bg-card p-4 text-sm leading-relaxed">
                    {v}
                  </div>
                )}
              />
            </div>
          </section>

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Comments
            </h2>
            <Suspense fallback={<CommentsSkeleton />}>
              <Await resolve={commentsPromise}>
                {(bugComments) => {
                  // Optimistic UI: when add-comment is in flight, render
                  // a placeholder row at the bottom so the new comment
                  // appears instantly. The real comment replaces it
                  // when the loader revalidates.
                  const optimisticBody =
                    submitting && submittingIntent === "add-comment"
                      ? (fetcher.formData?.get("body") as string | null)
                      : null;
                  const isEmpty = bugComments.length === 0 && !optimisticBody;
                  return (
                    <ol className="mt-3 space-y-4">
                      {isEmpty && (
                        <li className="text-sm text-muted-foreground">
                          No comments yet. Start the thread below.
                        </li>
                      )}
                      {bugComments.map((c) => (
                        <CommentItem
                          key={c.id}
                          comment={c}
                          currentUserId={currentUserId}
                          currentUserRole={currentUserRole}
                        />
                      ))}
                      {optimisticBody && (
                        <OptimisticCommentItem
                          body={optimisticBody}
                          authorName={currentUserName}
                        />
                      )}
                    </ol>
                  );
                }}
              </Await>
            </Suspense>
            <fetcher.Form method="post" noValidate className="mt-4">
              <input type="hidden" name="intent" value="add-comment" />
              <Textarea
                name="body"
                placeholder="Write a comment…"
                className="min-h-[80px]"
                maxLength={1000}
                required
                aria-invalid={
                  fetcher.data &&
                  "ok" in fetcher.data &&
                  fetcher.data.ok === false &&
                  !("status" in fetcher.data) &&
                  !("noop" in fetcher.data) &&
                  !("commentId" in fetcher.data)
                    ? true
                    : undefined
                }
                // Reset on successful submit. We key against the
                // fetcher's idle/data state since we no longer have
                // a sync count to key on.
                key={
                  fetcher.state === "idle" &&
                  fetcher.data &&
                  "ok" in fetcher.data &&
                  fetcher.data.ok === true
                    ? `composer-after-${(fetcher.data as { commentId?: string }).commentId ?? "sent"}`
                    : "composer"
                }
              />
              <div className="mt-2 flex justify-end">
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting && submittingIntent === "add-comment"}
                >
                  {submitting && submittingIntent === "add-comment"
                    ? "Posting…"
                    : "Post comment"}
                </Button>
              </div>
            </fetcher.Form>
          </section>

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Activity
            </h2>
            <Suspense fallback={<ActivitySkeleton />}>
              <Await resolve={activityPromise}>
                {(events) => {
                  return (
                    <ol className="mt-3 space-y-3">
                      {optimisticEvents.length === 0 && events.length === 0 && (
                        <li className="text-sm text-muted-foreground">
                          No activity yet.
                        </li>
                      )}
                      {optimisticEvents.map((event) => (
                        <OptimisticActivityItem key={event.id} event={event} />
                      ))}
                      {events.map((event) => (
                        <ActivityItem key={event.id} event={event} />
                      ))}
                    </ol>
                  );
                }}
              </Await>
            </Suspense>
          </section>
        </div>

        {/* Right rail: people + actions placeholder */}
        <aside className="space-y-6">
          <Suspense fallback={<RightRailUsersSkeleton />}>
            <Await resolve={headerUsersPromise}>
              {({ reporter, assignee }) => (
                <>
                  <section>
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      Reporter
                    </h2>
                    <div className="mt-2 flex items-center gap-2">
                      <Avatar className="size-8">
                        <AvatarFallback>
                          {initials(reporter.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm">
                        {reporter.displayName ?? reporter.name}
                      </span>
                    </div>
                  </section>

                  <section>
                    <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                      Assignee
                    </h2>
                    <AssigneePicker
                      currentAssignee={assignee}
                      assigneesPromise={assigneesPromise}
                      canChange={
                        currentUserRole === "sde" || currentUserRole === "admin"
                      }
                    />
                  </section>

                  <Separator />
                </>
              )}
            </Await>
          </Suspense>

          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Status
            </h2>
            <p className="mt-2 text-xs text-muted-foreground">
              You are signed in as{" "}
              <span className="font-medium">{currentUserRole}</span>.
              {allowedTransitions.length === 0 &&
                " No status changes are available from this state for your role."}
            </p>
            <ul className="mt-2 space-y-1 text-sm">
              {allowedTransitions.map((next) => {
                const isThisLoading = submittingTo === next;
                return (
                  <li
                    key={next}
                    className="flex items-center justify-between rounded-md border border-border px-3 py-1.5"
                  >
                    <span className="text-sm capitalize">
                      {next.replaceAll("_", " ")}
                    </span>
                    <fetcher.Form method="post" noValidate>
                      <input
                        type="hidden"
                        name="intent"
                        value="change-status"
                      />
                      <input type="hidden" name="to" value={next} />
                      <Button
                        size="sm"
                        variant="ghost"
                        type="submit"
                        disabled={submitting}
                      >
                        {isThisLoading ? "Moving…" : "Move"}
                      </Button>
                    </fetcher.Form>
                  </li>
                );
              })}
            </ul>
          </section>
        </aside>
      </div>
    </AppShell>
  );
}

// =============================================================================
// Small presentational helpers
// =============================================================================

function StatusPill({ status }: { status: Bug["status"] }) {
  return (
    <Pill className="capitalize">
      {status.replaceAll("_", " ")}
    </Pill>
  );
}

function priorityLabel(p: Bug["priority"]): string {
  return p.toUpperCase();
}

function severityLabel(s: Bug["severity"]): string {
  return s.toUpperCase();
}

function RightRailUsersSkeleton() {
  return (
    <div aria-busy="true" className="space-y-6">
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Reporter
        </h2>
        <div className="mt-2 flex items-center gap-2">
          <Skeleton className="size-8 rounded-full" />
          <Skeleton className="h-4 w-24" />
        </div>
      </section>
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Assignee
        </h2>
        <div className="mt-2 flex items-center gap-2">
          <Skeleton className="size-8 rounded-full" />
          <Skeleton className="h-4 w-20" />
        </div>
      </section>
      <Separator />
    </div>
  );
}

function CommentsSkeleton() {
  return (
    <ol aria-busy="true" className="mt-3 space-y-4">
      {Array.from({ length: 3 }).map((_, i) => (
        <li key={i} className="flex items-start gap-3">
          <Skeleton className="size-8 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-16" />
            </div>
            <Skeleton className="mt-2 h-4 w-full" />
            <Skeleton className="mt-1 h-4 w-4/5" />
          </div>
        </li>
      ))}
    </ol>
  );
}

function ActivitySkeleton() {
  return (
    <ol aria-busy="true" className="mt-3 space-y-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <li key={i} className="flex items-start gap-3">
          <Skeleton className="size-7 shrink-0 rounded-full" />
          <Skeleton className="h-4 w-3/4" />
        </li>
      ))}
    </ol>
  );
}
