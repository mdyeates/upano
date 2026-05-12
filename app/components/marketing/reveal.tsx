"use client";

import { motion, type Variants } from "motion/react";
import type { ReactNode } from "react";
import { cn } from "~/lib/utils";

export function Reveal({
  children,
  className,
  delay = 0,
  y = 100,
  stagger = false,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  stagger?: boolean;
}) {
  const variants: Variants = stagger
    ? {
        hidden: {},
        visible: {
          transition: {
            staggerChildren: 0.25,
            delayChildren: delay,
          },
        },
      }
    : {
        hidden: { opacity: 0, y },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.45,
            ease: [0.17, 1, 0.4, 1],
            delay,
          },
        },
      };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "0% 0px -10% 0px" }}
      variants={variants}
      className={cn(className)}
    >
      {children}
    </motion.div>
  );
}

/**
 * Wraps a single staggered child.
 */
export function RevealItem({
  children,
  className,
  y = 12,
}: {
  children: ReactNode;
  className?: string;
  y?: number;
}) {
  const variants: Variants = {
    hidden: { opacity: 0, y },
    visible: {
      opacity: 1,
      y: y,
      transition: {
        duration: 0.45,
        ease: [0.17, 1, 0.4, 1],
      },
    },
  };

  return (
    <motion.div variants={variants} className={cn(className)}>
      {children}
    </motion.div>
  );
}
