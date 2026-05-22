import {
  ArrowRightIcon,
  HelpCircleIcon,
  SparklesIcon,
  WorkflowIcon,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion, useMotionValueEvent, useScroll } from "motion/react";
import { useState } from "react";
import { Link } from "react-router";

import { ThemeSwitcher } from "~/components/kibo-ui/theme-switcher";
import { Button } from "~/components/ui/button";
import { DiscoverTabs } from "~/components/uselayouts/discover-tabs";
import type { NavIconKey, NavTab } from "~/content/marketing";
import { useTheme } from "~/lib/theme/theme";

const ICONS: Record<NavIconKey, LucideIcon> = {
  sparkles: SparklesIcon,
  workflow: WorkflowIcon,
  helpCircle: HelpCircleIcon,
};

const SCROLL_THRESHOLD = 80;

const fadeTransition = {
  duration: 0.25,
  ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
};

export function MarketingNav({ tabs }: { tabs: NavTab[] }) {
  const { theme, setTheme } = useTheme();
  const [condensed, setCondensed] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (y) => {
    if (!condensed && y > SCROLL_THRESHOLD) setCondensed(true);
    else if (condensed && y < SCROLL_THRESHOLD - 10) setCondensed(false);
  });

  const resolvedTabs = tabs.map((t) => ({
    id: t.id,
    label: t.label,
    icon: ICONS[t.iconKey],
    anchor: t.anchor,
    color: t.color,
    bg: t.bg,
  }));

  return (
    <>
      <motion.header
        animate={{
          opacity: condensed ? 0 : 1,
          y: condensed ? -8 : 0,
          pointerEvents: condensed ? "none" : "auto",
        }}
        transition={fadeTransition}
        className="fixed inset-x-0 top-0 z-40 w-full bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60"
      >
        <div className="container mx-auto flex h-16 max-w-6xl items-center px-4">
          <Link
            to="/"
            className="flex shrink-0 items-center gap-2 font-semibold"
          >
            <span
              aria-hidden
              className="inline-block size-6 rounded bg-foreground"
            />
            Upano
          </Link>

          <div className="ml-auto flex shrink-0 items-center gap-2">
            <div className="hidden sm:block">
              <ThemeSwitcher value={theme} onChange={setTheme} />
            </div>
            <Button
              asChild
              variant="ghost"
              size="pill-sm"
              className="hidden sm:inline-flex"
            >
              <Link to="/login" prefetch="intent">
                Login
              </Link>
            </Button>
            <Button asChild size="pill-sm" className="group">
              <Link to="/register" prefetch="intent">
                Get started
                <ArrowRightIcon className="ml-1 size-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
          </div>
        </div>
      </motion.header>

      <div className="pointer-events-none fixed inset-x-0 top-2 z-50 hidden justify-center md:flex">
        <div className="pointer-events-auto">
          <DiscoverTabs items={resolvedTabs} glass={condensed} />
        </div>
      </div>
    </>
  );
}
