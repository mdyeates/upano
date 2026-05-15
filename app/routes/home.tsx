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
import { MARKETING_CONTENT } from "~/content/marketing";

import type { Route } from "./+types/home";

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

/**
 * TODO:
 * Check if DB has enough storage to store all strings.
 * Will follow-up if I have the time, this is fine for now.
 * Would be fetched from loader,
 * if we were to fetch from DB instead of content files.
 */
export async function loader() {
  return MARKETING_CONTENT;
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return (
    <div className="min-h-screen bg-background pt-16 text-foreground">
      <MarketingNav tabs={loaderData.navTabs} />
      <main>
        <HeroSection content={loaderData.hero} />
        <StatsSection metrics={loaderData.metrics} />
        <FeaturesSection
          header={loaderData.featuresHeader}
          features={loaderData.features}
        />
        <FeatureRowsSection rows={loaderData.featureRows} />
        <FeatureCarousel
          heading={loaderData.carouselHeading}
          items={loaderData.carouselItems}
          className=""
          autoPlayMs={5000}
        />
        <CompareSection
          header={loaderData.compareHeader}
          rows={loaderData.compareRows}
        />
        <FaqSection header={loaderData.faqHeader} items={loaderData.faqs} />
        <CtaSection content={loaderData.cta} />
      </main>
      <FooterSection
        tagline={loaderData.footerTagline}
        credit={loaderData.footerCredit}
        columns={loaderData.footerColumns}
      />
    </div>
  );
}
