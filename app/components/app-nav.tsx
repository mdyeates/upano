"use client";

import {
  LayoutDashboardIcon,
  ListIcon,
  ShieldIcon,
  type LucideIcon,
} from "lucide-react";
import { motion } from "motion/react";
import { Link } from "react-router";
import { cn } from "~/lib/utils/utils";

export type AppNavPage = "dashboard" | "bugs" | "admin";

type NavItem = {
  id: AppNavPage;
  label: string;
  to: string;
  icon: LucideIcon;
  requiresRole?: "admin";
};

const NAV_ITEMS: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    to: "/dashboard",
    icon: LayoutDashboardIcon,
  },
  { id: "bugs", label: "Bugs", to: "/bugs", icon: ListIcon },
  {
    id: "admin",
    label: "Admin",
    to: "/admin",
    icon: ShieldIcon,
    requiresRole: "admin",
  },
];

export function AppNav({
  current,
  role,
  orientation = "horizontal",
  className,
}: {
  current: AppNavPage;
  role?: "reporter" | "sde" | "admin";
  orientation?: "horizontal" | "vertical";
  className?: string;
}) {
  const items = NAV_ITEMS.filter(
    (item) => !item.requiresRole || item.requiresRole === role,
  );
  if (orientation === "vertical") {
    return (
      <nav
        aria-label="Primary"
        className={cn("flex flex-col gap-1", className)}
      >
        {items.map((item) => {
          const isActive = current === item.id;
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              to={item.to}
              prefetch="intent"
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="app-nav-active-pill"
                  className="absolute inset-0 z-0 rounded-lg border border-border/40 bg-muted"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                />
              )}
              {isActive && (
                <motion.span
                  layoutId="app-nav-active-bar"
                  className="absolute left-0 top-1/2 z-10 h-4 w-[2px] -translate-y-1/2 rounded-full border border-primary/20 bg-primary"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                />
              )}
              <Icon
                className="relative z-10 size-4 shrink-0"
                strokeWidth={1.5}
              />
              <span className="relative z-10 font-mono text-xs uppercase tracking-wide">
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>
    );
  }
  return (
    <nav
      aria-label="Primary"
      className={cn(
        "relative flex h-12 items-center overflow-hidden rounded-[3rem]",
        "bg-card shadow-sm ring-1 ring-border",
        className,
      )}
    >
      <div className="flex items-center gap-1 px-1">
        {items.map((item) => {
          const isActive = current === item.id;
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              to={item.to}
              prefetch="intent"
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "relative flex items-center gap-2 rounded-[3rem] px-4 py-2 text-sm transition-colors",
                isActive
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {isActive && (
                <motion.span
                  layoutId="app-nav-active-pill"
                  className="absolute inset-0 z-0 rounded-[3rem] bg-secondary"
                  transition={{ type: "spring", bounce: 0.19, duration: 0.4 }}
                />
              )}
              <Icon
                className="relative z-10 size-4 shrink-0"
                strokeWidth={1.5}
              />
              <span className="relative z-10 hidden font-mono text-xs uppercase tracking-wide sm:inline">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
