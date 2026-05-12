import type { Route } from "./+types/home";

import { CompareSection } from "~/components/marketing/compare";
import { CtaSection } from "~/components/marketing/cta";
import { FaqSection } from "~/components/marketing/faq";
import { FeatureRowsSection } from "~/components/marketing/feature-rows";
import { FeaturesSection } from "~/components/marketing/features";
import { FooterSection } from "~/components/marketing/footer";
import { HeroSection } from "~/components/marketing/hero";
import { MarketingNav } from "~/components/marketing/nav";
import { StatsSection } from "~/components/marketing/stats";
import { FeatureCarousel } from "~/components/uselayouts/feature-carousel";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Upano" },
    {
      name: "description",
      content:
        "Internal bug-tracking tool with role-based access, server-enforced state machine, and append-only audit trail. Built for software teams that ship things customers depend on.",
    },
  ];
}

const carouselItems = [
  {
    id: "01",
    title: "Triage queue",
    description:
      "Group new bugs by priority and severity. Bulk-assign to an SDE, transition state, comment, all without leaving the keyboard.",
    image:
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=1600&auto=format&fit=crop",
    imageAlt: "Upano queue view showing prioritised list of open bugs",
  },
  {
    id: "02",
    title: "Bug detail",
    description:
      "Description, attachments, transition history, and the full audit log of every change to the bug, all in one scrollable view.",
    image:
      "https://images.unsplash.com/photo-1551434678-e076c223a692?q=80&w=1600&auto=format&fit=crop",
    imageAlt: "Bug detail page with status, assignee, and audit timeline",
  },
  {
    id: "03",
    title: "Audit & reports",
    description:
      "Time-windowed audit export, per-engineer triage throughput, mean-time-to-resolve. Manager-ready out of the box.",
    image:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1600&auto=format&fit=crop",
    imageAlt: "Reports dashboard showing audit log export and team throughput",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-background pt-16 text-foreground">
      <MarketingNav />
      <main>
        <HeroSection />
        <StatsSection />
        <FeaturesSection />
        <FeatureRowsSection />
        <FeatureCarousel
          heading="Three views into the same data."
          items={carouselItems}
          className={""}
          autoPlayMs={5000}
        />
        <CompareSection />
        <FaqSection />
        <CtaSection />
      </main>
      <FooterSection />
    </div>
  );
}
