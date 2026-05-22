import { Suspense } from "react";
import { formatDistanceToNow } from "date-fns";
import { Await, data, useFetcher, useRouteLoaderData } from "react-router";
import { z } from "zod";

import { AppShell } from "~/components/app-shell";
import { PageHeading, SectionHeading } from "~/components/page-heading";
import { RoleBadge } from "~/components/role-badge";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Badge } from "~/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Skeleton } from "~/components/ui/skeleton";
import { Spinner } from "~/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { getLocalUser } from "~/lib/auth/auth-middleware.server";
import { useActionToast } from "~/lib/hooks/use-action-toast";

import type { Route } from "./+types/admin";
import type { loader as authedLoader } from "./_authed";
import * as Admin from "~/domain/admin.server";
import { domainErrorToResponse } from "~/domain/_response";
import { actorLabel, type AuditActor } from "~/lib/utils";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Upano - Admin" },
    { name: "description", content: "Manage user roles." },
  ];
}

export async function loader({ context }: Route.LoaderArgs) {
  const localUser = getLocalUser(context);

  if (localUser.role !== "admin") {
    throw data("Forbidden", { status: 403 });
  }

  return {
    usersPromise: Admin.listUsers(),
    recentRoleChangesPromise: Admin.listRecentRoleChanges(),
  };
}

// =============================================================================
// Action - change roles of users
// =============================================================================

const changeRoleSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["reporter", "sde", "admin"]),
});

export async function action({ context, request }: Route.ActionArgs) {
  const localUser = getLocalUser(context);

  const formData = await request.formData();
  const intent = formData.get("intent");
  if (intent !== "change-role") {
    return data(
      { ok: false as const, error: "Unknown intent", fieldErrors: null },
      { status: 400 },
    );
  }

  const parsed = changeRoleSchema.safeParse({
    userId: formData.get("userId"),
    role: formData.get("role"),
  });
  if (!parsed.success) {
    return data(
      {
        ok: false as const,
        error: "Invalid input",
        fieldErrors: parsed.error.flatten().fieldErrors,
      },
      { status: 400 },
    );
  }

  try {
    const result = await Admin.changeRole({
      actorRole: localUser.role,
      actorId: localUser.id,
      targetUserId: parsed.data.userId,
      newRole: parsed.data.role,
    });
    return data({
      ok: true as const,
      noop: result.noop,
      role: result.role,
    });
  } catch (err) {
    const resp = domainErrorToResponse(err);
    if (resp) return resp;
    throw err;
  }
}

// =============================================================================
// Component
// =============================================================================

const ROLE_OPTIONS = [
  { value: "reporter", label: "Reporter" },
  { value: "sde", label: "SDE" },
  { value: "admin", label: "Admin" },
] as const;

function isRole(value: unknown): value is "reporter" | "sde" | "admin" {
  return value === "reporter" || value === "sde" || value === "admin";
}

function initials(name: string | null, fallback: string): string {
  const source = (name ?? fallback).trim();
  if (!source) return "?";
  const parts = source.split(/\s+/).slice(0, 2);
  return parts
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("")
    .padEnd(1, "?");
}

export default function AdminPage({ loaderData }: Route.ComponentProps) {
  const { usersPromise, recentRoleChangesPromise } = loaderData;
  const authed = useRouteLoaderData<typeof authedLoader>("routes/_authed")!;
  const { currentUserId, currentUserEmail } = authed;

  return (
    <AppShell current="admin" email={currentUserEmail} role="admin">
      <PageHeading
        title="Admin"
        subtitle="Manage user roles. Every change is logged to the audit trail."
      />

      <section className="mt-8">
        <SectionHeading
          title="Users"
          subtitle="Change a user’s role to grant or restrict access."
        />

        <Suspense fallback={<UsersTableSkeleton />}>
          <Await resolve={usersPromise}>
            {(rows) => <UsersTable rows={rows} currentUserId={currentUserId} />}
          </Await>
        </Suspense>
      </section>

      <section className="mt-12">
        <SectionHeading
          title="Recent role changes"
          subtitle="Latest 20 entries from the audit log."
        />

        <Suspense
          fallback={
            <div className="mt-4 space-y-2">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          }
        >
          <Await resolve={recentRoleChangesPromise}>
            {(events) => <RoleChangeFeed events={events} />}
          </Await>
        </Suspense>
      </section>
    </AppShell>
  );
}

// =============================================================================
// User table
// =============================================================================

type UserRow = {
  id: string;
  role: "reporter" | "sde" | "admin";
  displayName: string | null;
  createdAt: Date;
  name: string | null;
  email: string | null;
  image: string | null;
};

function UsersTable({
  rows,
  currentUserId,
}: {
  rows: UserRow[];
  currentUserId: string;
}) {
  if (rows.length === 0) {
    return (
      <div className="mt-6 rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">No users yet.</p>
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-lg border border-border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead className="hidden md:table-cell">Email</TableHead>
            <TableHead className="hidden lg:table-cell">Joined</TableHead>
            <TableHead className="w-[180px] sm:w-[220px] md:w-[260px]">
              Role
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <UserTableRow
              key={row.id}
              row={row}
              isCurrentUser={row.id === currentUserId}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function UserTableRow({
  row,
  isCurrentUser,
}: {
  row: UserRow;
  isCurrentUser: boolean;
}) {
  const fetcher = useFetcher<typeof action>();
  const submitting = fetcher.state !== "idle";

  // Toast on success/error. Inline error stays — a row-local hint is
  // useful when several rows fail in succession — but the toast is
  // the primary success signal so the inline "Saved." is gone.
  useActionToast(fetcher, {
    success: (d) => {
      const targetName = row.name ?? row.displayName ?? "User";
      return `${targetName} is now ${String(d.role).toUpperCase()}.`;
    },
  });

  // Optimistic role: when a submission is in flight, reflect the
  // pending value so the Select doesn't snap back to the old role.
  const pendingRole = submitting
    ? (fetcher.formData?.get("role") as
        | "reporter"
        | "sde"
        | "admin"
        | undefined)
    : undefined;
  const displayRole = pendingRole ?? row.role;

  const handleChange = (role: string) => {
    if (role === row.role) return;
    fetcher.submit(
      { intent: "change-role", userId: row.id, role },
      { method: "post" },
    );
  };

  const error =
    fetcher.data && !fetcher.data.ok ? fetcher.data.error : undefined;

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="size-8">
            <AvatarFallback className="text-xs">
              {initials(row.name, row.email ?? row.id)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="truncate font-medium">
                {row.name ?? row.displayName ?? "Unnamed user"}
              </span>
              {isCurrentUser && (
                <Badge variant="outline" className="text-xs">
                  You
                </Badge>
              )}
            </div>
            <RoleBadge role={displayRole} className="mt-0.5" />
          </div>
        </div>
      </TableCell>
      <TableCell className="hidden text-muted-foreground md:table-cell">
        {row.email ?? <span className="italic">(no email)</span>}
      </TableCell>
      <TableCell className="hidden text-muted-foreground lg:table-cell">
        {formatDistanceToNow(row.createdAt, { addSuffix: true })}
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Select
              value={displayRole}
              onValueChange={handleChange}
              disabled={submitting}
            >
              <SelectTrigger
                className="flex-1 sm:w-[200px] sm:flex-none"
                aria-label="Change role"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ROLE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {submitting && (
              <Spinner
                className="size-4 text-muted-foreground"
                aria-label="Saving role change"
              />
            )}
          </div>
          {error && (
            <p className="text-xs text-destructive" role="alert">
              {error}
            </p>
          )}
        </div>
      </TableCell>
    </TableRow>
  );
}

function UsersTableSkeleton() {
  return (
    <div className="mt-4 rounded-lg border border-border bg-card p-4">
      <div className="space-y-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
    </div>
  );
}

// =============================================================================
// Recent role changes feed
// =============================================================================

type RoleChangeEvent = {
  id: number;
  actor: AuditActor | null;
  target: AuditActor | null;
  oldValue: string | null;
  newValue: string | null;
  createdAt: Date;
};

function RoleChangeFeed({ events }: { events: RoleChangeEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="mt-4 rounded-lg border border-border bg-card p-8 text-center">
        <p className="text-sm text-muted-foreground">
          No role changes yet. The first time you promote a user it&apos;ll show
          up here.
        </p>
      </div>
    );
  }

  return (
    <ul className="mt-4 divide-y divide-border rounded-lg border border-border bg-card">
      {events.map((e) => (
        <li key={e.id} className="flex items-center justify-between gap-4 p-4">
          <div className="min-w-0 text-sm">
            <span className="font-medium">{actorLabel(e.actor)}</span>{" "}
            <span className="text-muted-foreground">changed</span>{" "}
            <span className="font-medium">{actorLabel(e.target)}</span>{" "}
            <span className="text-muted-foreground">from</span>{" "}
            {isRole(e.oldValue) ? (
              <RoleBadge role={e.oldValue} />
            ) : (
              <Badge variant="outline" className="text-[10px] uppercase">
                {e.oldValue ?? "?"}
              </Badge>
            )}{" "}
            <span className="text-muted-foreground">to</span>{" "}
            {isRole(e.newValue) ? (
              <RoleBadge role={e.newValue} />
            ) : (
              <Badge variant="outline" className="text-[10px] uppercase">
                {e.newValue ?? "?"}
              </Badge>
            )}
          </div>
          <time
            className="shrink-0 text-xs text-muted-foreground"
            dateTime={
              e.createdAt instanceof Date
                ? e.createdAt.toISOString()
                : new Date(e.createdAt).toISOString()
            }
          >
            {formatDistanceToNow(new Date(e.createdAt), { addSuffix: true })}
          </time>
        </li>
      ))}
    </ul>
  );
}
