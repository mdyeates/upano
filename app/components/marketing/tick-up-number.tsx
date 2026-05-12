"use client";

import { animate, useInView, useMotionValue, useTransform } from "motion/react";
import { useEffect, useRef } from "react";

export type TickUpNumberProps = {
  to: number;
  duration?: number;
  format: (value: number) => string;
  once?: boolean;
  className: string;
};

const defaultFormat = (n: number) =>
  Math.round(n).toLocaleString(undefined, { maximumFractionDigits: 0 });

export function TickUpNumber({
  to,
  duration = 1.6,
  format = defaultFormat,
  once = true,
  className,
}: TickUpNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once, margin: "-15% 0px -15% 0px" });
  const value = useMotionValue(0);
  const display = useTransform(value, format);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(value, to, {
      duration,
      ease: [0.16, 1, 0.3, 1],
    });
    return () => controls.stop();
  }, [inView, to, duration, value]);

  useEffect(() => {
    return display.on("change", (next) => {
      if (ref.current) ref.current.textContent = next;
    });
  }, [display]);

  return (
    <span ref={ref} className={className}>
      {format(0)}
    </span>
  );
}
