"use client";

import { CheckIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import { Button } from "~/components/ui/button";
import { cn } from "~/lib/utils/utils";

type Status = "idle" | "loading" | "success";

export type SaveButtonProps = {
  onSave?: () => Promise<unknown> | void;
  state?: Status;
  type?: "button" | "submit" | "reset";
  labels?: { idle?: string; loading?: string; success?: string };
  successHoldMs?: number;
  disabled?: boolean;
  className?: string;
};

export function SaveButton({
  onSave,
  state,
  type = "button",
  labels,
  successHoldMs = 2000,
  disabled,
  className,
}: SaveButtonProps) {
  const [internal, setInternal] = useState<Status>("idle");
  const status = state ?? internal;
  const isControlled = state !== undefined;

  const text = useMemo(() => {
    switch (status) {
      case "idle":
        return labels?.idle ?? "Save";
      case "loading":
        return labels?.loading ?? "Saving";
      case "success":
        return labels?.success ?? "Saved";
    }
  }, [status, labels]);

  const handleClick = async () => {
    // Controlled mode: parent drives `state` from outside (e.g. RR7
    // navigation/fetcher).
    if (isControlled) {
      if (onSave) await onSave();
      return;
    }
    if (status !== "idle") return;
    if (!onSave) return;
    setInternal("loading");
    try {
      await onSave();
      setInternal("success");
      window.setTimeout(() => setInternal("idle"), successHoldMs);
    } catch {
      setInternal("idle");
    }
  };

  return (
    <div className={cn("group relative inline-flex font-sans", className)}>
      <Button
        type={type}
        onClick={handleClick}
        className={cn(
          "relative h-12 min-w-[140px] rounded-full px-8 text-base font-medium transition-all duration-300 disabled:opacity-100",
          status === "idle"
            ? "transition-colors"
            : "cursor-not-allowed border-muted bg-muted text-muted-foreground shadow-sm hover:bg-muted",
        )}
        variant="default"
        disabled={disabled || status !== "idle"}
      >
        <span className="flex items-center justify-center">
          <AnimatePresence mode="popLayout" initial={false}>
            {text.split("").map((char, i) => (
              <motion.span
                key={`${char}-${i}`}
                layout
                initial={{ opacity: 0, scale: 0, filter: "blur(4px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0, filter: "blur(4px)" }}
                transition={{
                  type: "spring",
                  stiffness: 500,
                  damping: 30,
                  mass: 1,
                }}
                className="inline-block"
              >
                {char}
              </motion.span>
            ))}
          </AnimatePresence>
        </span>
      </Button>

      <div className="pointer-events-none absolute -right-1 -top-1 z-10">
        <AnimatePresence mode="wait">
          {status !== "idle" && (
            <motion.div
              initial={{ opacity: 0, scale: 0, x: -8, filter: "blur(4px)" }}
              animate={{ opacity: 1, scale: 1, x: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0, x: -8, filter: "blur(4px)" }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={cn(
                "flex size-6 items-center justify-center overflow-visible rounded-full ring-3",
                status === "success"
                  ? "bg-primary text-primary-foreground ring-muted"
                  : "bg-muted text-muted-foreground ring-muted",
              )}
            >
              <AnimatePresence mode="popLayout">
                {status === "loading" && (
                  <motion.div
                    key="loader"
                    initial={{ opacity: 1 }}
                    animate={{ opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                    >
                      <path
                        fill="currentColor"
                        d="M12 2A10 10 0 1 0 22 12A10 10 0 0 0 12 2Zm0 18a8 8 0 1 1 8-8A8 8 0 0 1 12 20Z"
                        opacity=".5"
                      />
                      <path
                        fill="currentColor"
                        d="M20 12h2A10 10 0 0 0 12 2V4A8 8 0 0 1 20 12Z"
                      >
                        <animateTransform
                          attributeName="transform"
                          dur="1s"
                          from="0 12 12"
                          repeatCount="indefinite"
                          to="360 12 12"
                          type="rotate"
                        />
                      </path>
                    </svg>
                  </motion.div>
                )}
                {status === "success" && (
                  <motion.div
                    key="check"
                    initial={{ scale: 0, opacity: 0, filter: "blur(4px)" }}
                    animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
                    exit={{ scale: 0, opacity: 0, filter: "blur(4px)" }}
                    transition={{ type: "spring", stiffness: 500, damping: 25 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <CheckIcon className="size-4" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
