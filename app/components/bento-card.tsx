"use client";

import React, { useMemo, useState } from "react";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DashboardSquare01Icon,
  BugIcon,
  ClipboardIcon,
  UserGroupIcon,
  CircleArrowUpRight02Icon,
  AlertCircleIcon,
  CheckmarkCircle02Icon,
  Tick01Icon,
  Settings02Icon,
  Search01Icon,
  UserIcon,
  Message01Icon,
  ArrowRight01Icon,
  ShieldUserIcon,
} from "@hugeicons/core-free-icons";

import { cn } from "~/lib/utils/utils";

interface TabConfig {
  id: string;
  label: string;
  icon: typeof DashboardSquare01Icon;
  badge?: string;
  header: string;
  description: string;
}

const TABS: TabConfig[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: DashboardSquare01Icon,
    header: "Here's whats happening across your team",
    description: "Open work, urgent bugs, and what closed this week.",
  },
  {
    id: "bugs",
    label: "Bugs",
    icon: BugIcon,
    badge: "12",
    header: "Triage queue",
    description: "Open bugs ordered by priority, then most recently updated.",
  },
  {
    id: "detail",
    label: "Detail",
    icon: ClipboardIcon,
    header: "BUG-0042 \u00b7 In progress",
    description: "Status, assignee, and the full audit timeline.",
  },
  {
    id: "admin",
    label: "Admin",
    icon: UserGroupIcon,
    header: "Role management",
    description:
      "Promote, demote, and audit \u2014 with a self-demotion guard.",
  },
];

const BentoCard = () => {
  const [activeTab, setActiveTab] = useState(TABS[0]);

  const content = useMemo(() => {
    switch (activeTab.id) {
      case "dashboard":
        return <DashboardPreview />;
      case "bugs":
        return <BugsPreview />;
      case "detail":
        return <BugDetailPreview />;
      case "admin":
        return <AdminPreview />;
      default:
        return null;
    }
  }, [activeTab.id]);

  return (
    <div className="flex w-full items-center justify-center antialiased">
      <div className="group relative m-0 w-full max-w-xl overflow-hidden rounded-3xl border bg-card shadow-2xl shadow-primary/5 transition-all duration-500 hover:-translate-y-1 hover:shadow-primary/10 sm:rounded-4xl">
        <div className="relative z-10 space-y-1.5 p-4 sm:p-6">
          <h2 className="text-xs uppercase text-muted-foreground">
            Upano Preview
          </h2>
          <p className="max-w-[480px] text-lg font-medium leading-snug text-foreground sm:text-2xl">
            Click a tab to peek at each view.
          </p>
        </div>

        <div className="relative h-[260px] w-full overflow-hidden rounded-2xl sm:h-[300px] sm:rounded-[2rem]">
          <div className="absolute left-16 top-16 h-full w-full rounded-3xl border border-border/50 bg-muted opacity-80" />

          <div className="absolute left-24 top-8 flex h-full w-full flex-col overflow-hidden rounded-tl-3xl bg-background shadow-xl ring-6 ring-border">
            <div className="relative flex items-center rounded-tl-3xl border-b border-border/70 px-5 py-4 backdrop-blur-sm">
              <div className="flex gap-1.5">
                <div className="h-2 w-2 rounded-full bg-muted-foreground/20" />
                <div className="h-2 w-2 rounded-full bg-muted-foreground/20" />
                <div className="h-2 w-2 rounded-full bg-muted-foreground/20" />
              </div>
              <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2">
                <span className="text-xs uppercase text-muted-foreground/50">
                  Upano
                </span>
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
              <div className="flex w-36 flex-col gap-1 border-r border-border/30 bg-muted/5 p-2 pt-6">
                <LayoutGroup>
                  {TABS.map((tab) => {
                    const isActive = activeTab.id === tab.id;
                    const Icon = tab.icon;

                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab)}
                        className={cn(
                          "relative flex cursor-pointer items-center gap-1.5 rounded-xl p-2 text-xs transition-colors",
                          isActive
                            ? "text-foreground"
                            : "text-muted-foreground hover:text-foreground",
                        )}
                      >
                        <HugeiconsIcon
                          icon={Icon}
                          size={14}
                          className="relative z-20 shrink-0"
                        />
                        <span className="relative z-20 truncate font-medium">
                          {tab.label}
                        </span>
                        {tab.badge && (
                          <span
                            className={cn(
                              "relative z-20 ml-auto rounded-md px-1 py-0.5 text-[8px] leading-none tabular-nums transition-all",
                              isActive
                                ? "border border-primary/20 bg-primary/10 text-primary"
                                : "border border-transparent bg-muted text-muted-foreground",
                            )}
                          >
                            {tab.badge}
                          </span>
                        )}

                        {isActive && (
                          <motion.div
                            layoutId="sidebar-pill"
                            className="absolute left-0 z-30 h-4 w-[2px] rounded-full border border-primary/20 bg-primary"
                            transition={{
                              type: "spring",
                              bounce: 0.2,
                              duration: 0.6,
                            }}
                          />
                        )}
                        {isActive && (
                          <motion.div
                            layoutId="backgroundIndicator"
                            className="absolute inset-0 rounded-lg border border-border/40 bg-muted"
                            transition={{
                              type: "spring",
                              bounce: 0.2,
                              duration: 0.6,
                            }}
                          />
                        )}
                      </button>
                    );
                  })}
                </LayoutGroup>
              </div>

              <div className="relative flex flex-1 flex-col gap-4 overflow-hidden bg-background p-5 pt-6">
                <header className="flex flex-col gap-0.5">
                  <h3 className="line-clamp-1 text-xs font-semibold uppercase tracking-tight text-foreground opacity-60">
                    {activeTab.header}
                  </h3>
                  <p className="line-clamp-1 text-[10px] font-normal leading-tight text-muted-foreground">
                    {activeTab.description}
                  </p>
                </header>

                <AnimatePresence mode="popLayout" initial={false}>
                  <motion.div
                    key={activeTab.id}
                    initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
                    transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
                    className="flex-1"
                  >
                    {content}
                  </motion.div>
                </AnimatePresence>

                <div className="pointer-none absolute bottom-0 left-0 right-0 z-20 h-10 bg-linear-to-t from-background to-transparent" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BentoCard;

const DashboardPreview = () => (
  <div className="flex h-full flex-col gap-3">
    <div className="relative overflow-hidden rounded-xl border border-border/40 bg-linear-to-br from-background to-muted/20 p-3.5">
      <div className="relative z-10 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-medium text-muted-foreground">
            Open bugs
          </span>
          <HugeiconsIcon
            icon={CircleArrowUpRight02Icon}
            size={12}
            className="text-primary"
          />
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-xl font-medium tracking-tight text-foreground">
            12
          </span>
          <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "60%" }}
              className="h-full rounded-full bg-primary"
            />
          </div>
        </div>
        <span className="text-[9px] text-muted-foreground">
          Across all bugs not yet resolved or closed
        </span>
      </div>
    </div>

    <div className="grid grid-cols-3 gap-2">
      <KpiTile label="Urgent" value="3" icon={AlertCircleIcon} />
      <KpiTile label="My queue" value="5" icon={UserIcon} />
      <KpiTile label="Closed 7d" value="8" icon={CheckmarkCircle02Icon} />
    </div>
  </div>
);

const KpiTile = ({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon: typeof DashboardSquare01Icon;
}) => (
  <div className="flex items-center justify-between rounded-xl border border-border/40 bg-background/50 p-3">
    <div className="flex flex-col">
      <span className="text-[10px] font-medium text-foreground">{value}</span>
      <span className="text-[8px] font-medium uppercase text-muted-foreground">
        {label}
      </span>
    </div>
    <HugeiconsIcon icon={icon} size={14} className="opacity-20" />
  </div>
);

const BugsPreview = () => (
  <div className="not-prose flex h-full flex-col">
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border/40 bg-background/50">
      <div className="flex items-center justify-between border-b border-border/40 bg-muted/30 px-3 py-2">
        <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
          12 bugs
        </span>
        <div className="flex items-center gap-1.5 rounded-md border border-border/40 bg-background px-1.5 py-0.5">
          <HugeiconsIcon
            icon={Search01Icon}
            size={10}
            className="text-muted-foreground/50"
          />
          <span className="text-[8px] font-medium text-muted-foreground">
            All statuses
          </span>
        </div>
      </div>
      <div className="flex flex-col gap-0.5 p-1">
        {[
          {
            id: "BUG-0042",
            title: "Status filter persists after refresh",
            priority: "P0",
            severity: "S1",
            color: "bg-rose-400",
          },
          {
            id: "BUG-0041",
            title: "Assignee picker shows reporter accounts",
            priority: "P1",
            severity: "S2",
            color: "bg-amber-400",
          },
          {
            id: "BUG-0039",
            title: "Audit timeline truncates long comments",
            priority: "P2",
            severity: "S3",
            color: "bg-emerald-400",
          },
        ].map((bug) => (
          <div
            key={bug.id}
            className="group flex items-center gap-2 rounded-lg p-2 transition-colors hover:bg-muted/30"
          >
            <span className="font-mono text-[8px] font-medium uppercase tracking-tight text-muted-foreground">
              {bug.id}
            </span>
            <span className="line-clamp-1 flex-1 text-[10px] font-medium text-foreground">
              {bug.title}
            </span>
            <span className="rounded border border-border/40 bg-background px-1 py-0.5 text-[8px] font-medium tabular-nums text-muted-foreground">
              {bug.priority}
            </span>
            <span
              className={cn("h-1.5 w-1.5 rounded-full", bug.color)}
              aria-label={`severity ${bug.severity}`}
            />
          </div>
        ))}
      </div>
    </div>
  </div>
);

const BugDetailPreview = () => (
  <div className="flex h-full flex-col gap-3 overflow-hidden">
    <div className="flex items-center gap-2">
      <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-tight text-amber-700 dark:text-amber-300">
        <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
        In progress
      </span>
      <span className="rounded border border-border/40 bg-background px-1.5 py-0.5 text-[8px] font-medium tabular-nums text-muted-foreground">
        P1
      </span>
      <span className="rounded border border-border/40 bg-background px-1.5 py-0.5 text-[8px] font-medium tabular-nums text-muted-foreground">
        S2
      </span>
    </div>

    <div className="flex-1 overflow-hidden rounded-xl border border-border/40 bg-background/50">
      <div className="flex items-center justify-between border-b border-border/40 bg-muted/30 px-3 py-2">
        <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
          Activity
        </span>
        <HugeiconsIcon
          icon={Message01Icon}
          size={12}
          className="text-muted-foreground/30"
        />
      </div>
      <div className="flex flex-col gap-0 p-1">
        {[
          {
            who: "Carol",
            what: "moved status",
            detail: "triaged \u2192 in_progress",
            tone: "status",
          },
          {
            who: "Bob",
            what: "commented",
            detail: "Repro confirmed on Safari 17",
            tone: "comment",
          },
          {
            who: "Carol",
            what: "reassigned",
            detail: "Mike \u2192 Bob",
            tone: "assignee",
          },
        ].map((event, i) => (
          <div
            key={i}
            className="flex items-start gap-2 rounded-lg p-2 transition-colors hover:bg-muted/30"
          >
            <div className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-border/40 bg-muted">
              <HugeiconsIcon
                icon={
                  event.tone === "comment"
                    ? Message01Icon
                    : event.tone === "assignee"
                      ? UserIcon
                      : CircleArrowUpRight02Icon
                }
                size={8}
                className="text-muted-foreground/70"
              />
            </div>
            <div className="flex min-w-0 flex-1 flex-col leading-tight">
              <span className="text-[10px] text-foreground">
                <span className="font-medium">{event.who}</span>{" "}
                <span className="text-muted-foreground">{event.what}</span>
              </span>
              <span className="line-clamp-1 text-[8px] text-muted-foreground">
                {event.detail}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  </div>
);

const AdminPreview = () => (
  <div className="not-prose flex h-full flex-col">
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border/40 bg-background/50">
      <div className="flex items-center justify-between border-b border-border/40 bg-muted/30 px-3 py-2">
        <span className="text-[9px] font-semibold uppercase tracking-wider text-muted-foreground">
          Users
        </span>
        <HugeiconsIcon
          icon={ShieldUserIcon}
          size={12}
          className="text-muted-foreground/30"
        />
      </div>
      <div className="flex flex-col gap-0 p-1">
        {[
          {
            name: "Carol Admin",
            role: "ADMIN",
            roleVariant: "admin" as const,
            you: true,
          },
          {
            name: "Bob Engineer",
            role: "SDE",
            roleVariant: "sde" as const,
          },
          {
            name: "Alice Reporter",
            role: "REPORTER",
            roleVariant: "reporter" as const,
          },
        ].map((user) => (
          <div
            key={user.name}
            className="group flex items-center gap-2.5 rounded-lg p-2 transition-colors hover:bg-muted/30"
          >
            <div className="flex h-5 w-5 items-center justify-center rounded-full border border-border/40 bg-muted">
              <HugeiconsIcon
                icon={UserIcon}
                size={9}
                className="text-muted-foreground"
              />
            </div>
            <div className="flex min-w-0 flex-1 items-center gap-1.5">
              <span className="line-clamp-1 text-[10px] font-medium text-foreground">
                {user.name}
              </span>
              {user.you && (
                <span className="rounded border border-border/40 bg-background px-1 py-px text-[7px] font-medium uppercase text-muted-foreground">
                  You
                </span>
              )}
            </div>
            <span
              className={cn(
                "rounded px-1.5 py-px font-mono text-[7px] font-semibold uppercase tracking-wide",
                user.roleVariant === "admin" &&
                  "border border-primary/30 bg-primary/10 text-primary",
                user.roleVariant === "sde" &&
                  "border border-border/40 bg-muted text-muted-foreground",
                user.roleVariant === "reporter" &&
                  "border border-border/40 bg-background text-muted-foreground",
              )}
            >
              {user.role}
            </span>
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              size={10}
              className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
            />
          </div>
        ))}
      </div>
      <div className="mt-auto flex items-center justify-between border-t border-border/30 bg-muted/20 px-3 py-2">
        <div className="flex items-center gap-2">
          <HugeiconsIcon
            icon={Tick01Icon}
            size={10}
            className="text-emerald-500"
          />
          <span className="text-[9px] font-medium text-muted-foreground">
            Self-demotion blocked at the action layer
          </span>
        </div>
        <HugeiconsIcon
          icon={Settings02Icon}
          size={10}
          className="text-muted-foreground/40"
        />
      </div>
    </div>
  </div>
);
