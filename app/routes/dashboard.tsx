// import { and, count, desc, eq, gte, isNull, sql } from "drizzle-orm";
import { formatDistanceToNow } from "date-fns";
import { Suspense } from "react";
import { Await, Link, useRouteLoaderData } from "react-router";
import {
  ActivityIcon,
  AlertTriangleIcon,
  CheckCircle2Icon,
  InboxIcon,
  type LucideIcon,
} from "lucide-react";
import { AppShell } from "~/components/app-shell";
import { PageHeading, SectionHeading } from "~/components/page-heading";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import { Pill } from "~/components/kibo-ui/pill";
import { Skeleton } from "~/components/ui/skeleton";
import { cn } from "~/lib/utils/utils";
import { type AuditEvent, type Bug } from "~/database/schema";
import { getLocalUser } from "~/lib/auth/auth-middleware.server";
import type { Route } from "./+types/dashboard";
import type { loader as authedLoader } from "./_authed";
import * as Dashboard from "~/domain/dashboard.server";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Dashboard" },
    { name: "description", content: "Your Upano dashboard." },
  ];
}

export async function loader({ context }: Route.LoaderArgs) {
  const localUser = getLocalUser(context);
  return {
    kpiPromise: Dashboard.getKpis(localUser),
    myQueuePromise: Dashboard.getMyQueue(localUser),
    recentActivityPromise: Dashboard.getRecentActivity(localUser),
  };
}

export default function DashboardPage({ loaderData }: Route.ComponentProps) {
  const { kpiPromise, myQueuePromise, recentActivityPromise } = loaderData;
  const authed = useRouteLoaderData<typeof authedLoader>("routes/_authed")!;
  const { currentUserName, currentUserEmail, currentUserRole } = authed;

  const firstName = currentUserName ? currentUserName.split(" ")[0] : "";
  const isReporter = currentUserRole === "reporter";

  const dashboardSubtitle = isReporter
    ? "Here’s what’s happening with the bugs you’ve filed."
    : "Here’s what’s happening across your team.";
  const activitySubtitle = isReporter
    ? "The last few changes on bugs you’ve filed."
    : "The last few changes across every bug.";

  return (
    <AppShell
      current="dashboard"
      email={currentUserEmail}
      role={currentUserRole}
      asHeading
      mainClassName="container mx-auto max-w-6xl space-y-8 px-4 py-8"
    >
      <PageHeading
        as="h2"
        title={`Welcome${firstName ? `, ${firstName}` : ""}.`}
        subtitle={dashboardSubtitle}
      />

      {/* KPI cards */}
      <Suspense fallback={<KpiCardsSkeleton />}>
        <Await resolve={kpiPromise}>{(kpi) => <KpiCards kpi={kpi} />}</Await>
      </Suspense>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* My queue */}
        <section>
          <SectionHeading
            as="h3"
            title="My queue"
            subtitle="Bugs assigned to you that aren’t resolved or closed."
          />
          <Suspense fallback={<MyQueueSkeleton />}>
            <Await resolve={myQueuePromise}>
              {(queue) => <MyQueue bugs={queue} />}
            </Await>
          </Suspense>
        </section>

        {/* Recent activity */}
        <section>
          <SectionHeading
            as="h3"
            title="Recent activity"
            subtitle={activitySubtitle}
          />
          <Suspense fallback={<ActivityFeedSkeleton />}>
            <Await resolve={recentActivityPromise}>
              {(events) => <ActivityFeed events={events} />}
            </Await>
          </Suspense>
        </section>
      </div>
    </AppShell>
  );
}

// =============================================================================
// Dashboard helpers + types
// =============================================================================

// KPIs

type Kpi = {
  openCount: number;
  urgentCount: number;
  myQueueCount: number;
  closedThisWeek: number;
};

type KpiTone = "neutral" | "primary" | "warning" | "success";

type KpiCardConfig = {
  label: string;
  value: number;
  description: string;
  icon: LucideIcon;
  tone: KpiTone;
};

const TONE_STYLES: Record<
  KpiTone,
  {
    ring: string;
    iconBg: string;
    iconFg: string;
    numberFg: string;
  }
> = {
  neutral: {
    ring: "ring-border",
    iconBg: "bg-muted",
    iconFg: "text-muted-foreground",
    numberFg: "text-brand-900",
  },
  primary: {
    ring: "ring-primary/30",
    iconBg: "bg-primary/10",
    iconFg: "text-primary",
    numberFg: "text-brand-900",
  },
  warning: {
    ring: "ring-rose-400/30 dark:ring-rose-300/30",
    iconBg: "bg-rose-400/10 dark:bg-rose-300/10",
    iconFg: "text-rose-600 dark:text-rose-300",
    numberFg: "text-rose-700 dark:text-rose-200",
  },
  success: {
    ring: "ring-emerald-500/30 dark:ring-emerald-400/30",
    iconBg: "bg-emerald-500/10 dark:bg-emerald-400/10",
    iconFg: "text-emerald-600 dark:text-emerald-300",
    numberFg: "text-emerald-700 dark:text-emerald-200",
  },
};

function KpiCards({ kpi }: { kpi: Kpi }) {
  const cards: KpiCardConfig[] = [
    {
      label: "Open",
      value: kpi.openCount,
      description: "All bugs not yet resolved or closed",
      icon: InboxIcon,
      tone: "neutral",
    },
    {
      label: "Urgent",
      value: kpi.urgentCount,
      description: "Open P0 + P1 priority",
      icon: AlertTriangleIcon,
      tone: "warning",
    },
    {
      label: "My queue",
      value: kpi.myQueueCount,
      description: "Open bugs assigned to you",
      icon: ActivityIcon,
      tone: "primary",
    },
    {
      label: "Cleared this week",
      value: kpi.closedThisWeek,
      description: "Closed in the past 7 days",
      icon: CheckCircle2Icon,
      tone: "success",
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {cards.map((card) => {
        const Icon = card.icon;
        const styles = TONE_STYLES[card.tone];
        return (
          <div
            key={card.label}
            className={cn(
              "group relative overflow-hidden rounded-xl bg-card p-4 ring-1 transition-all",
              "hover:-translate-y-0.5 hover:shadow-md",
              styles.ring,
            )}
          >
            <div className="flex items-start justify-between gap-3">
              <p className="font-mono text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {card.label}
              </p>
              <span
                className={cn(
                  "inline-flex size-7 items-center justify-center rounded-md",
                  styles.iconBg,
                  styles.iconFg,
                )}
              >
                <Icon className="size-4" strokeWidth={1.75} />
              </span>
            </div>
            <div
              className={cn(
                "mt-3 font-heading text-4xl font-bold tabular-nums tracking-tight",
                styles.numberFg,
              )}
            >
              {card.value}
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              {card.description}
            </p>
          </div>
        );
      })}
    </div>
  );
}

function KpiCardsSkeleton() {
  return (
    <div aria-busy="true" className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl bg-card p-4 ring-1 ring-border">
          <div className="flex items-start justify-between">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="size-7 rounded-md" />
          </div>
          <Skeleton className="mt-3 h-9 w-12" />
          <Skeleton className="mt-2 h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

// My Queue

function formatBugId(id: number): string {
  return `BUG-${String(id).padStart(4, "0")}`;
}

function MyQueue({ bugs }: { bugs: Bug[] }) {
  if (bugs.length === 0) {
    return (
      <div className="mt-3 rounded-lg border border-dashed border-border bg-card/50 px-4 py-8 text-center">
        <p className="text-sm text-muted-foreground">
          Nothing assigned to you. Quiet today.
        </p>
      </div>
    );
  }
  return (
    <ul className="mt-3 divide-y divide-border rounded-lg border border-border bg-card">
      {bugs.map((bug) => (
        <li key={bug.id}>
          <Link
            to={`/bugs/${bug.id}`}
            prefetch="intent"
            className="block px-4 py-3 transition-colors hover:bg-muted/50 focus:bg-muted/50 focus:outline-none"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <span className="font-mono text-xs text-muted-foreground">
                  {formatBugId(bug.id)}
                </span>
                <h4 className="mt-0.5 truncate text-sm font-medium">
                  {bug.title}
                </h4>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusPill status={bug.status} />
                  <Badge variant="outline" className="text-xs">
                    {bug.priority.toUpperCase()}
                  </Badge>
                </div>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(bug.updatedAt), {
                  addSuffix: true,
                })}
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

function MyQueueSkeleton() {
  return (
    <ul
      aria-busy="true"
      className="mt-3 divide-y divide-border rounded-lg border border-border bg-card"
    >
      {Array.from({ length: 3 }).map((_, i) => (
        <li key={i} className="px-4 py-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="mt-1 h-4 w-3/4" />
              <div className="mt-2 flex items-center gap-2">
                <Skeleton className="h-5 w-20 rounded-full" />
                <Skeleton className="h-5 w-10" />
              </div>
            </div>
            <Skeleton className="h-3 w-12" />
          </div>
        </li>
      ))}
    </ul>
  );
}

// Recent Activity

type ActivityRow = {
  id: number;
  bugId: number;
  actorId: string;
  eventType: AuditEvent["eventType"];
  field: string | null;
  oldValue: string | null;
  newValue: string | null;
  metadata: unknown;
  createdAt: Date;
  bugTitle: string;
  actor: { id: string; displayName: string | null; name: string | null } | null;
};

function ActivityFeed({ events }: { events: ActivityRow[] }) {
  if (events.length === 0) {
    return (
      <div className="mt-3 rounded-lg border border-dashed border-border bg-card/50 px-4 py-8 text-center">
        <p className="text-sm text-muted-foreground">
          No recent activity. The audit log will populate as your team works.
        </p>
      </div>
    );
  }
  return (
    <ol className="mt-3 space-y-3">
      {events.map((event) => (
        <ActivityFeedItem key={event.id} event={event} />
      ))}
    </ol>
  );
}

function ActivityFeedItem({ event }: { event: ActivityRow }) {
  const who = event.actor?.displayName ?? event.actor?.name ?? "Someone";
  const when = formatDistanceToNow(new Date(event.createdAt), {
    addSuffix: true,
  });
  const initials = who
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <li className="flex items-start gap-3 text-sm">
      <Avatar className="size-7">
        <AvatarFallback className="text-xs">{initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1 leading-snug">
        <span className="font-medium">{who}</span> {describeEvent(event)}{" "}
        <Link
          to={`/bugs/${event.bugId}`}
          prefetch="intent"
          className="font-medium text-brand-700 hover:underline"
        >
          {formatBugId(event.bugId)}
        </Link>
        {event.bugTitle && (
          <span className="text-muted-foreground"> · {event.bugTitle}</span>
        )}
        <div className="text-xs text-muted-foreground">{when}</div>
      </div>
    </li>
  );
}

function describeEvent(event: AuditEvent): string {
  switch (event.eventType) {
    case "bug_created":
      return "filed";
    case "status_changed":
      return `moved status to ${event.newValue ?? "(none)"} on`;
    case "priority_changed":
      return `changed priority to ${event.newValue ?? "(none)"} on`;
    case "severity_changed":
      return `changed severity to ${event.newValue ?? "(none)"} on`;
    case "assignee_changed":
      return event.oldValue ? `reassigned` : `assigned`;
    case "title_changed":
      return "edited the title of";
    case "description_changed":
      return "edited the description of";
    case "comment_added":
      return "commented on";
    case "comment_edited":
      return "edited a comment on";
    case "comment_deleted":
      return "deleted a comment on";
    case "bug_deleted":
      return "deleted";
    case "role_changed":
      return `changed role from ${event.oldValue ?? "(none)"} to ${event.newValue ?? "(none)"} for`;
    default:
      return "made a change to";
  }
}

function ActivityFeedSkeleton() {
  return (
    <ol aria-busy="true" className="mt-3 space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <li key={i} className="flex items-start gap-3">
          <Skeleton className="size-7 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="mt-1 h-3 w-20" />
          </div>
        </li>
      ))}
    </ol>
  );
}

// Status Pill

function StatusPill({ status }: { status: Bug["status"] }) {
  return (
    <Pill className="capitalize text-xs">
      {status.replaceAll("_", " ")}
    </Pill>
  );
}
