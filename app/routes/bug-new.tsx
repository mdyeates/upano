import { z } from "zod";
import {
  data,
  Form,
  Link,
  redirect,
  useFetcher,
  useRouteLoaderData,
} from "react-router";

import { AppShell } from "~/components/app-shell";
import { PageHeading } from "~/components/page-heading";
import { Button } from "~/components/ui/button";
import { Field, FieldError, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Spinner } from "~/components/ui/spinner";
import { Textarea } from "~/components/ui/textarea";
import * as Bugs from "~/domain/bugs.server";
import { getLocalUser } from "~/lib/auth/auth-middleware.server";

import type { Route } from "./+types/bug-new";
import type { loader as authedLoader } from "./_authed";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "File a bug — Upano" },
    { name: "description", content: "Report a new bug." },
  ];
}

// =============================================================================
// Action
// =============================================================================

const bugCreateSchema = z.object({
  title: z
    .string({ message: "Add a title for the bug." })
    .trim()
    .min(1, "Title can’t be empty.")
    .max(50, "Title is too long (50 character maximum)."),
  description: z
    .string({ message: "Add a description for the bug." })
    .trim()
    .min(1, "Description can’t be empty.")
    .max(10_000, "Description is too long (10,000 character maximum)."),
  priority: z.enum(["p0", "p1", "p2", "p3", "p4"], {
    message: "Pick a priority.",
  }),
  severity: z.enum(["sev1", "sev2", "sev3", "sev4"], {
    message: "Pick a severity.",
  }),
});

export async function action({ context, request }: Route.ActionArgs) {
  const localUser = getLocalUser(context);
  const formData = await request.formData();

  const parsed = bugCreateSchema.safeParse({
    title: formData.get("title") || undefined,
    description: formData.get("description") || undefined,
    priority: formData.get("priority") || undefined,
    severity: formData.get("severity") || undefined,
  });

  if (!parsed.success) {
    return data(
      {
        ok: false as const,
        fieldErrors: parsed.error.flatten().fieldErrors,
        formError: null as string | null,
      },
      { status: 400 },
    );
  }

  const newBug = await Bugs.create({
    title: parsed.data.title,
    description: parsed.data.description,
    priority: parsed.data.priority,
    severity: parsed.data.severity,
    reporterId: localUser.id,
  });

  // Redirect to the new bug's detail page so the user can see it
  // immediately.
  throw redirect(`/bugs/${newBug.id}?created=1`);
}

// =============================================================================
// Component
// =============================================================================

export default function BugNew() {
  // Auth identity comes from the parent _authed layout's loader.
  const authed = useRouteLoaderData<typeof authedLoader>("routes/_authed")!;
  const { currentUserEmail, currentUserRole } = authed;
  const fetcher = useFetcher<typeof action>();
  const submitting = fetcher.state === "submitting";
  const fieldErrors = (
    fetcher.data && "fieldErrors" in fetcher.data
      ? fetcher.data.fieldErrors
      : null
  ) as Record<string, string[] | undefined> | null;

  return (
    <AppShell
      current="bugs"
      email={currentUserEmail}
      role={currentUserRole}
      mainClassName="container mx-auto max-w-2xl px-4 py-8"
    >
      <PageHeading
        title="File a bug"
        subtitle="Be specific. Future-you and your teammates will thank you."
      />

      <Form
        method="post"
        noValidate
        className="mt-8 space-y-6"
        onSubmit={(event) => {
          event.preventDefault();
          const fd = new FormData(event.currentTarget);
          fetcher.submit(fd, { method: "post" });
        }}
      >
        <Field>
          <FieldLabel htmlFor="title">Title</FieldLabel>
          <Input
            id="title"
            name="title"
            placeholder="Triage queue shows wrong assignee on page reload"
            required
            maxLength={50}
            aria-invalid={fieldErrors?.title ? true : undefined}
          />
          <FieldError>{fieldErrors?.title?.[0]}</FieldError>
        </Field>

        <Field>
          <FieldLabel htmlFor="description">Description</FieldLabel>
          <Textarea
            id="description"
            name="description"
            placeholder="Steps to reproduce, what you expected, what happened, and any logs or screenshots."
            required
            rows={8}
            maxLength={10_000}
            aria-invalid={fieldErrors?.description ? true : undefined}
          />
          <FieldError>{fieldErrors?.description?.[0]}</FieldError>
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field>
            <FieldLabel htmlFor="priority">Priority</FieldLabel>
            <Select name="priority" defaultValue="p3">
              <SelectTrigger id="priority">
                <SelectValue placeholder="Pick a priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="p0">P0 — drop everything</SelectItem>
                <SelectItem value="p1">P1 — fix this sprint</SelectItem>
                <SelectItem value="p2">P2 — fix soon</SelectItem>
                <SelectItem value="p3">P3 — eventually</SelectItem>
                <SelectItem value="p4">P4 — wishlist</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field>
            <FieldLabel htmlFor="severity">Severity</FieldLabel>
            <Select name="severity" defaultValue="sev3">
              <SelectTrigger id="severity">
                <SelectValue placeholder="Pick a severity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sev1">SEV1 — outage</SelectItem>
                <SelectItem value="sev2">SEV2 — major impact</SelectItem>
                <SelectItem value="sev3">SEV3 — minor impact</SelectItem>
                <SelectItem value="sev4">SEV4 — cosmetic</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4">
          <Button type="button" variant="ghost" asChild>
            <Link to="/bugs">Cancel</Link>
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? (
              <>
                <Spinner /> Filing
              </>
            ) : (
              "File bug"
            )}
          </Button>
        </div>
      </Form>
    </AppShell>
  );
}
