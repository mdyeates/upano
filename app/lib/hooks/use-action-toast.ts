import { useEffect, useRef } from "react";
import type { useFetcher } from "react-router";
import { toast } from "sonner";

/**
 * Action-result shape produced by every server action in this app:
 * `data({ ok: true, ... })` for success and `data({ ok: false, error })`
 * for failure.
 */

type ActionEnvelope =
  | {
      ok: true;
      /**
       * A flag indicating the action ran but no real change
       * happened (e.g. setting a user's role to its current value).
       * When true we either skip the toast.
       */
      noop?: boolean;
      [key: string]: unknown;
    }
  | { ok: false; error?: string; [key: string]: unknown };

type Fetcher = ReturnType<typeof useFetcher<ActionEnvelope>>;

export function useActionToast(
  fetcher: Fetcher,
  options: {
    /**
     * Message to show on success.
     * If the action returns extra data, you can access it via a function.
     */
    success:
      | string
      | ((data: { ok: true } & Record<string, unknown>) => string);
    /**
     * Optional explicit error message. Defaults to data.error returned
     * by the action; falls back to a generic message if neither is set.
     */
    error?:
      | string
      | ((data: { ok: false } & Record<string, unknown>) => string);
    /**
     * What to show when an action runs but reports `noop: true`.
     * Pass `null` to skip the toast entirely on no-ops.
     */
    noopMessage?: string | null;
  },
): void {
  // Track the last data we already toasted so re-renders with the same
  // value don't fire duplicate toasts.
  const lastToastedRef = useRef<ActionEnvelope | null>(null);

  useEffect(() => {
    const data = fetcher.data;
    if (!data) return;
    if (lastToastedRef.current === data) return;
    if (fetcher.state !== "idle") return;
    lastToastedRef.current = data;

    if (data.ok) {
      if (data.noop) {
        if (options.noopMessage) {
          toast.info(options.noopMessage);
        }
        return;
      }
      const successData = data as { ok: true } & Record<string, unknown>;
      const message =
        typeof options.success === "function"
          ? options.success(successData)
          : options.success;
      toast.success(message);
    } else {
      const errorData = data as { ok: false } & Record<string, unknown>;
      const message =
        options.error !== undefined
          ? typeof options.error === "function"
            ? options.error(errorData)
            : options.error
          : (errorData.error ?? "Something went wrong. Please try again.");
      toast.error(typeof message === "string" ? message : String(message));
    }
  }, [fetcher.data, fetcher.state, options]);
}
