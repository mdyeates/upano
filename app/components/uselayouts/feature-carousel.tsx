"use client";

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";
import { cn } from "~/lib/utils/utils";

export type FeatureCarouselItem = {
  id: string;
  title: string;
  description: string;
  image: string;
  imageAlt?: string;
};

export type FeatureCarouselProps = {
  heading: string;
  items: FeatureCarouselItem[];
  autoPlayMs: number;
  className: string;
};

export function FeatureCarousel({
  heading,
  items,
  autoPlayMs,
  className,
}: FeatureCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const handleNext = useCallback(() => {
    setDirection(1);
    setActiveIndex((prev) => (prev + 1) % items.length);
  }, [items.length]);

  const handlePrev = useCallback(() => {
    setDirection(-1);
    setActiveIndex((prev) => (prev - 1 + items.length) % items.length);
  }, [items.length]);

  const handleTabClick = (index: number) => {
    if (index === activeIndex) return;
    setDirection(index > activeIndex ? 1 : -1);
    setActiveIndex(index);
    setIsPaused(false);
  };

  useEffect(() => {
    if (isPaused || autoPlayMs <= 0) return;
    const interval = window.setInterval(handleNext, autoPlayMs);
    return () => window.clearInterval(interval);
  }, [activeIndex, isPaused, autoPlayMs, handleNext]);

  const variants = {
    enter: (dir: number) => ({
      y: dir > 0 ? "-100%" : "100%",
      opacity: 0,
    }),
    center: { zIndex: 1, y: 0, opacity: 1 },
    exit: (dir: number) => ({
      zIndex: 0,
      y: dir > 0 ? "100%" : "-100%",
      opacity: 0,
    }),
  };

  return (
    <section
      className={cn("w-full bg-background py-8 md:py-16 lg:py-24", className)}
    >
      <div className="container mx-auto max-w-6xl px-4">
        <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Left: tab list */}
          <div className="order-2 flex flex-col justify-center pt-4 lg:order-1 lg:col-span-5">
            <div className="mb-12 space-y-1">
              <h2 className="text-balance font-heading text-3xl font-medium tracking-tighter text-brand-900 md:text-4xl lg:text-5xl">
                {heading}
              </h2>
            </div>

            <div className="flex flex-col space-y-0">
              {items.map((item, index) => {
                const isActive = activeIndex === index;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleTabClick(index)}
                    type="button"
                    className={cn(
                      "group relative flex min-h-[140px] items-start gap-4 border-t border-border/50 py-6 text-left transition-all duration-500 first:border-0 md:min-h-[160px] md:py-8",
                      isActive
                        ? "text-foreground"
                        : "text-muted-foreground/60 hover:text-foreground",
                    )}
                  >
                    <div className="absolute -left-4 bottom-0 top-0 w-[2px] bg-muted md:-left-6">
                      {isActive && (
                        <motion.div
                          key={`progress-${index}-${isPaused}`}
                          className="absolute left-0 top-0 w-full origin-top bg-foreground"
                          initial={{ height: "0%" }}
                          animate={
                            isPaused ? { height: "0%" } : { height: "100%" }
                          }
                          transition={{
                            duration: autoPlayMs / 1000,
                            ease: "linear",
                          }}
                        />
                      )}
                    </div>

                    <span className="mt-1 text-[9px] font-medium tabular-nums text-brand-500 md:text-[10px]">
                      /{item.id}
                    </span>

                    <div className="flex flex-1 flex-col gap-2">
                      <span
                        className={cn(
                          "text-2xl font-normal tracking-tight transition-colors duration-500 md:text-3xl lg:text-4xl",
                          isActive ? "text-foreground" : "",
                        )}
                      >
                        {item.title}
                      </span>
                      <div
                        className={cn(
                          "grid transition-all duration-300 ease-out",
                          isActive
                            ? "grid-rows-[1fr] opacity-100"
                            : "grid-rows-[0fr] opacity-0",
                        )}
                      >
                        <div className="min-h-0 overflow-hidden">
                          <p className="max-w-sm pb-2 text-sm font-normal leading-relaxed text-muted-foreground md:text-base">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: image gallery */}
          <div className="order-1 flex h-full flex-col justify-end lg:order-2 lg:col-span-7">
            <div
              className="group/gallery relative"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >
              <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-border/40 bg-muted/30 md:aspect-[4/3] md:rounded-[2.5rem] lg:aspect-[16/11]">
                <AnimatePresence
                  initial={false}
                  custom={direction}
                  mode="popLayout"
                >
                  <motion.div
                    key={activeIndex}
                    custom={direction}
                    variants={variants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                      y: { type: "spring", stiffness: 260, damping: 32 },
                      opacity: { duration: 0.4 },
                    }}
                    className="absolute inset-0 h-full w-full cursor-pointer"
                    onClick={handleNext}
                  >
                    <img
                      src={items[activeIndex].image}
                      alt={
                        items[activeIndex].imageAlt ?? items[activeIndex].title
                      }
                      className="m-0 block h-full w-full object-cover p-0 transition-transform duration-700 hover:scale-105"
                    />
                    <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-60" />
                  </motion.div>
                </AnimatePresence>

                <div className="absolute bottom-6 right-6 z-20 flex gap-2 md:bottom-8 md:right-8 md:gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrev();
                    }}
                    type="button"
                    className="flex size-10 items-center justify-center rounded-full border border-border/50 bg-background/80 text-foreground backdrop-blur-md transition-all hover:bg-background active:scale-90 md:size-12"
                    aria-label="Previous"
                  >
                    <ChevronLeftIcon size={20} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNext();
                    }}
                    type="button"
                    className="flex size-10 items-center justify-center rounded-full border border-border/50 bg-background/80 text-foreground backdrop-blur-md transition-all hover:bg-background active:scale-90 md:size-12"
                    aria-label="Next"
                  >
                    <ChevronRightIcon size={20} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
