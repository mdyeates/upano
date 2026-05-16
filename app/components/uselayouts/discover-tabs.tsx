"use client";

import { motion } from "motion/react";
import {
  type ComponentType,
  type SVGProps,
  useEffect,
  useRef,
  useState,
} from "react";
import { cn } from "~/lib/utils/utils";

export type DiscoverNavItem<T extends string = string> = {
  id: T;
  label: string;
  icon: ComponentType<SVGProps<SVGSVGElement> & { size?: number }>;
  anchor: string;
  color?: string;
  fill?: string;
  bg?: string;
};

export type DiscoverTabsProps<T extends string = string> = {
  items: DiscoverNavItem<T>[];
  value?: T;
  defaultValue?: T;
  onChange?: (next: T) => void;
  scrollSpy?: boolean;
  glass: boolean;
  className?: string;
};

export function DiscoverTabs<T extends string = string>({
  items,
  value,
  defaultValue,
  onChange,
  scrollSpy,
  glass,
  className,
}: DiscoverTabsProps<T>) {
  const [internal, setInternal] = useState<T>(
    (defaultValue ?? items[0]?.id) as T,
  );
  const active = (value ?? internal) as T;

  const setActive = (next: T) => {
    if (value === undefined) setInternal(next);
    onChange?.(next);
  };

  const enableSpy = scrollSpy ?? items.some((i) => Boolean(i.anchor));
  const programmaticScrollLockRef = useRef(false);

  useEffect(() => {
    if (!enableSpy || typeof window === "undefined") return;
    const targets: Array<{ id: T; el: Element }> = [];
    for (const item of items) {
      if (!item.anchor) continue;
      const el = document.getElementById(item.anchor);
      if (el) targets.push({ id: item.id, el });
    }
    if (targets.length === 0) return;

    // IntersectionObserver fires whenever a section crosses the
    // viewport's middle band. We pick the entry with the largest
    // intersection ratio to decide which pill should be active.
    let lastChosen: T | null = null;
    const io = new IntersectionObserver(
      (entries) => {
        // Prevent IO callbacks firing during a programmatic scroll
        // as they make the active pill bounce as the page passes through
        // each section.
        if (programmaticScrollLockRef.current) return;
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible.length === 0) return;
        const match = targets.find((t) => t.el === visible[0].target);
        if (!match || match.id === lastChosen) return;
        lastChosen = match.id;
        setActive(match.id);
      },
      {
        rootMargin: "-20% 0px -20% 0px",
        threshold: [0, 0.25, 0.5, 0.75, 1],
      },
    );
    for (const t of targets) io.observe(t.el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enableSpy, items]);

  const handleClick = (item: DiscoverNavItem<T>) => {
    setActive(item.id);
    if (item.anchor && typeof document !== "undefined") {
      const target = document.getElementById(item.anchor);
      if (target) {
        programmaticScrollLockRef.current = true;
        window.setTimeout(() => {
          programmaticScrollLockRef.current = false;
        }, 750);
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  return (
    <div className={cn("flex h-full items-center gap-3", className)}>
      <motion.div
        layout
        transition={{
          type: "spring",
          damping: 20,
          stiffness: 230,
          mass: 1.2,
        }}
        className={cn(
          "relative flex h-12 items-center overflow-hidden rounded-[3rem] transition-colors",
          glass
            ? "bg-background/60 shadow-sm ring-1 ring-border/40 backdrop-blur supports-[backdrop-filter]:bg-background/40"
            : "bg-card shadow-md ring-1 ring-border",
        )}
      >
        <div className="flex items-center gap-1 px-1">
          {items.map((tab) => {
            const isActive = active === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleClick(tab)}
                className={cn(
                  "relative flex items-center gap-2 rounded-[3rem] px-4 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? (tab.color ?? "text-foreground")
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {isActive && (
                  <motion.span
                    layoutId="discover-bubble"
                    className={cn(
                      "absolute inset-0 z-0",
                      tab.bg ?? "bg-secondary",
                    )}
                    style={{ borderRadius: 9999 }}
                    transition={{
                      type: "spring",
                      bounce: 0.19,
                      duration: 0.4,
                    }}
                  />
                )}
                <Icon
                  size={18}
                  className={cn("relative z-10 shrink-0", isActive && tab.fill)}
                />
                <span className="relative z-10 font-mono text-xs uppercase tracking-wide">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
