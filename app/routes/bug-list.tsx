import { Suspense } from "react";
import { and, asc, desc, eq, isNull, sql as drizzleSql } from "drizzle-orm";
import { formatDistanceToNow } from "date-fns";
import { Await, Link, useRouteLoaderData, useSearchParams } from "react-router";

import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { AppShell } from "~/components/app-shell";
import { PageHeading } from "~/components/page-heading";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Pill } from "~/components/kibo-ui/pill";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Skeleton } from "~/components/ui/skeleton";
import { database } from "~/database/context";
import { neonUser } from "~/database/neon-auth-schema";
import { bugs, users, type Bug } from "~/database/schema";
import { getLocalUser } from "~/lib/auth/auth-middleware.server";
import type { Route } from "./+types/bug-list";
import type { loader as authedLoader } from "./_authed";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Upano - bugs" },
    { name: "description", content: "All bugs in your team's queue." },
  ];
}

const STATUS_FILTER_OPTIONS = [
  { value: "all", label: "All statuses" },
  { value: "new", label: "New" },
  { value: "triaged", label: "Triaged" },
  { value: "in_progress", label: "In progress" },
  { value: "in_review", label: "In review" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
] as const;

type StatusFilter = (typeof STATUS_FILTER_OPTIONS)[number]["value"];

function isStatusFilter(value: unknown): value is StatusFilter {
  return STATUS_FILTER_OPTIONS.some((opt) => opt.value === value);
}

/**
 * Custom SQL ordering for priority because Postgres orders enums by
 * declaration order (p0 < p1 < ... < p4), and that's already what we
 * want — p0 is the highest priority. Same for severity. So plain ASC
 * gives the right "most urgent first" order.
 *
 * Streams: returns the bugs query as an UN-AWAITED promise. The route
 * shell (header / nav / filter dropdown / page title) ships immediately
 * with HTML; the bug list streams in as the promise resolves. See the
 * <Suspense> boundary in the component.
 */
export async function loader({ context, request }: Route.LoaderArgs) {
  const url = new URL(request.url);
  const rawStatus = url.searchParams.get("status");
  const statusFilter: StatusFilter = isStatusFilter(rawStatus)
    ? rawStatus
    : "all";

  const localUser = getLocalUser(context);
  const db = database();

  const reporterScope =
    localUser.role === "reporter"
      ? eq(bugs.reporterId, localUser.id)
      : undefined;

  const rowsPromise = db
    .select({
      bug: bugs,
      reporterRole: users.role,
      reporterDisplayName: users.displayName,
      reporterName: neonUser.name,
      reporterEmail: neonUser.email,
    })
    .from(bugs)
    .innerJoin(users, eq(users.id, bugs.reporterId))
    .leftJoin(neonUser, drizzleSql`${neonUser.id} = ${users.id}::uuid`)
    .where(and(isNull(bugs.deletedAt), reporterScope))
    .orderBy(asc(bugs.priority), desc(bugs.createdAt))
    .then((allRows) => {
      const rows =
        statusFilter === "all"
          ? allRows
          : allRows.filter((r) => r.bug.status === statusFilter);
      return {
        rows,
        totalCount: allRows.length,
        filteredCount: rows.length,
      };
    });

  return {
    statusFilter,
    rowsPromise,
  };
}

export default function BugList({ loaderData }: Route.ComponentProps) {
  const { rowsPromise, statusFilter } = loaderData;
  const authed = useRouteLoaderData<typeof authedLoader>("routes/_authed")!;
  const { currentUserEmail, currentUserRole } = authed;
  const [searchParams, setSearchParams] = useSearchParams();

  const onStatusChange = (value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value === "all") {
      next.delete("status");
    } else {
      next.set("status", value);
    }
    setSearchParams(next);
  };

  return (
    <AppShell current="bugs" email={currentUserEmail} role={currentUserRole}>
      <PageHeading
        title={currentUserRole === "reporter" ? "Your bugs" : "Bugs"}
        subtitle={
          <Suspense fallback={<>Loading…</>}>
            <Await resolve={rowsPromise}>
              {({ totalCount, filteredCount }) =>
                statusFilter === "all"
                  ? `${totalCount} bug${totalCount === 1 ? "" : "s"} total`
                  : `${filteredCount} of ${totalCount} bug${totalCount === 1 ? "" : "s"}`
              }
            </Await>
          </Suspense>
        }
        actions={
          <>
            <Button asChild>
              <Link to="/bugs/new" prefetch="intent">
                File a bug
              </Link>
            </Button>
            <Select value={statusFilter} onValueChange={onStatusChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_FILTER_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
      />

      <Suspense fallback={<BugListSkeleton />}>
        <Await resolve={rowsPromise}>
          {({ rows }) =>
            rows.length === 0 ? (
              <EmptyState statusFilter={statusFilter} />
            ) : (
              <ul className="mt-8 divide-y divide-border rounded-lg border border-border bg-card">
                {rows.map((r) => (
                  <BugRow key={r.bug.id} {...r} />
                ))}
              </ul>
            )
          }
        </Await>
      </Suspense>
    </AppShell>
  );
}

// =============================================================================
// Skeleton
// =============================================================================

function BugListSkeleton() {
  return (
    <ul
      aria-busy="true"
      className="mt-8 divide-y divide-border rounded-lg border border-border bg-card"
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i} className="px-4 py-3">
          <div className="flex items-start gap-4">
            <Skeleton className="h-3 w-16 shrink-0" />
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-3">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-16 shrink-0" />
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-10 rounded" />
                <Skeleton className="h-5 w-12 rounded" />
                <Skeleton className="ml-2 h-5 w-32" />
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

// =============================================================================
// Row + helpers
// =============================================================================

function formatBugId(id: number): string {
  return `BUG-${String(id).padStart(4, "0")}`;
}

function initials(name: string | null): string {
  if (!name) return "?";
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function BugRow({
  bug,
  reporterDisplayName,
  reporterName,
}: {
  bug: Bug;
  reporterRole: string;
  reporterDisplayName: string | null;
  reporterName: string | null;
  reporterEmail: string | null;
}) {
  const reporterLabel =
    reporterDisplayName ?? reporterName ?? "(unknown reporter)";

  return (
    <li>
      <Link
        to={`/bugs/${bug.id}`}
        prefetch="intent"
        className="block px-4 py-3 transition-colors hover:bg-muted/50 focus:bg-muted/50 focus:outline-none"
      >
        <div className="flex items-start gap-4">
          <div className="flex shrink-0 flex-col items-center gap-1">
            <span className="font-mono text-xs text-muted-foreground">
              {formatBugId(bug.id)}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <h3 className="truncate text-sm font-medium text-foreground">
                {bug.title}
              </h3>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(bug.updatedAt), {
                  addSuffix: true,
                })}
              </span>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-2">
              <StatusPill status={bug.status} />
              <Badge variant="outline" className="text-xs">
                {bug.priority.toUpperCase()}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {bug.severity.toUpperCase()}
              </Badge>
              <span className="ml-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                <Avatar className="size-5">
                  <AvatarFallback className="text-[10px]">
                    {initials(reporterName ?? reporterDisplayName)}
                  </AvatarFallback>
                </Avatar>
                {reporterLabel}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </li>
  );
}

function StatusPill({ status }: { status: Bug["status"] }) {
  return (
    <Pill className="capitalize text-xs">{status.replaceAll("_", " ")}</Pill>
  );
}

function EmptyState({ statusFilter }: { statusFilter: StatusFilter }) {
  return (
    <div className="mt-12 flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-card/50 px-6 py-16 text-center">
      <h2 className="heading-section">No bugs found</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {statusFilter === "all"
          ? "Nothing in the queue. When something breaks, it'll show up here."
          : `No bugs currently in '${statusFilter.replaceAll("_", " ")}'. Try a different filter.`}
      </p>
    </div>
  );
}
