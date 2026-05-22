"use client";

import { motion } from "motion/react";
import type { ComponentProps } from "react";
import { cn } from "~/lib/utils/utils";
import { Button } from "~/components/ui/button";

export type StatusButtonState = "idle" | "loading" | "success" | "error";

export type StatusButtonProps = ComponentProps<typeof Button> & {
  state?: StatusButtonState;
  idleLabel?: string;
  loadingLabel?: string;
  successLabel?: string;
  errorLabel?: string;
};

export function StatusButton({
  state = "idle",
  idleLabel = "Submit",
  loadingLabel = "Submitting…",
  successLabel = "Done",
  errorLabel = "Try again",
  className,
  disabled,
  children,
  ...props
}: StatusButtonProps) {
  const label =
    state === "loading"
      ? loadingLabel
      : state === "success"
        ? successLabel
        : state === "error"
          ? errorLabel
          : idleLabel;

  return (
    <Button
      disabled={disabled || state === "loading"}
      className={cn("relative min-w-28", className)}
      {...props}
    >
      <motion.span
        key={state}
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
      >
        {children ?? label}
      </motion.span>
    </Button>
  );
}
