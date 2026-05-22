import { useState } from "react";
import { useFetcher } from "react-router";
import { Button } from "~/components/ui/button";
import { Spinner } from "~/components/ui/spinner";
import { Textarea } from "~/components/ui/textarea";
import { useActionToast } from "~/lib/hooks/use-action-toast";
import type { action as bugDetailAction } from "~/routes/bug-detail";

/**
 * Inline field to edit a bug's title or description.
 */
export function InlineEditField({
  intent,
  field,
  value,
  canEdit,
  multiline,
  ariaLabel,
  renderValue,
}: {
  intent: "edit-title" | "edit-description";
  field: "title" | "description";
  value: string;
  canEdit: boolean;
  multiline: boolean;
  ariaLabel: string;
  renderValue: (value: string) => React.ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const fetcher = useFetcher<typeof bugDetailAction>();
  const submitting = fetcher.state !== "idle";
  const error =
    fetcher.data && "ok" in fetcher.data && fetcher.data.ok === false
      ? fetcher.data.error
      : null;

  useActionToast(fetcher, {
    success: () =>
      intent === "edit-title" ? "Title updated." : "Description updated.",
    noopMessage: null,
  });

  const pendingValue =
    submitting && fetcher.formData?.get("intent") === intent
      ? (fetcher.formData.get(field) as string | null)
      : null;
  const displayValue = pendingValue ?? value;

  if (!canEdit) {
    return <>{renderValue(displayValue)}</>;
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        aria-label={`Edit ${ariaLabel.toLowerCase()}`}
        className="block w-full whitespace-normal break-words text-left transition-colors hover:opacity-80 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-sm"
      >
        {renderValue(displayValue)}
        {pendingValue && (
          <span className="ml-2 inline-flex items-center gap-1 align-middle text-xs italic text-muted-foreground">
            <Spinner className="size-3" />
            saving
          </span>
        )}
      </button>
    );
  }

  return (
    <fetcher.Form
      method="post"
      noValidate
      onSubmit={() => setEditing(false)}
      className="mt-1"
    >
      <input type="hidden" name="intent" value={intent} />
      {multiline ? (
        <Textarea
          name={field}
          defaultValue={value}
          aria-label={ariaLabel}
          className="min-h-[120px] w-full text-base font-normal"
          autoFocus
          required
          maxLength={10_000}
        />
      ) : (
        <Textarea
          name={field}
          defaultValue={value}
          aria-label={ariaLabel}
          autoFocus
          required
          maxLength={100}
          rows={2}
          className="min-h-[3rem] w-full break-words rounded-md border border-input bg-background px-3 py-2 text-3xl font-bold tracking-tight text-brand-900 sm:text-4xl focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      )}
      <div className="mt-2 flex items-center gap-2">
        <Button type="submit" size="sm" disabled={submitting}>
          {submitting ? "Saving…" : "Save"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() => setEditing(false)}
        >
          Cancel
        </Button>
        {error && (
          <span
            role="alert"
            className="text-xs text-rose-700 dark:text-rose-300"
          >
            {error}
          </span>
        )}
      </div>
    </fetcher.Form>
  );
}
