import { data, redirect, useFetcher } from "react-router";

import { AuthFormError, AuthPageShell } from "~/components/auth/auth-shell";
import { Field, FieldError, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { MultiStepForm } from "~/components/uselayouts/multi-step-form";
import { registerSchema, type RegisterValues } from "~/lib/auth-schemas";
import {
  authCookieHeaders,
  getSession,
  mapAuthError,
  postAuth,
} from "~/lib/auth.server";

import type { Route } from "./+types/register";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Register — Upano" },
    {
      name: "description",
      content: "Create an Upano account for your Amazon team.",
    },
  ];
}

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request);
  if (session?.user) {
    throw redirect("/dashboard");
  }
  return null;
}

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const parsed = registerSchema.safeParse({
    name: formData.get("name") || undefined,
    email: formData.get("email") || undefined,
    password: formData.get("password") || undefined,
    confirmPassword: formData.get("confirmPassword") || undefined,
    displayName: formData.get("displayName") || undefined,
  });

  if (!parsed.success) {
    return data(
      {
        fieldErrors: parsed.error.flatten().fieldErrors,
        formError: null as string | null,
      },
      { status: 400 },
    );
  }

  const { name, email, password } = parsed.data;
  const { status, body, setCookie } = await postAuth(
    request,
    "/sign-up/email",
    { email, password, name },
  );

  if (status >= 400) {
    const mapped = mapAuthError(status, body);
    return data(
      { fieldErrors: {}, formError: mapped.message },
      { status: status === 422 ? 409 : 400 },
    );
  }

  return redirect("/dashboard", { headers: authCookieHeaders(setCookie) });
}

export default function RegisterPage() {
  const fetcher = useFetcher<typeof action>();
  const submitting = fetcher.state === "submitting";
  const actionData = fetcher.data;

  const submitRegister = (values: RegisterValues) => {
    const fd = new FormData();
    fd.set("name", values.name);
    fd.set("email", values.email);
    fd.set("password", values.password);
    fd.set("confirmPassword", values.confirmPassword);
    if (values.displayName) fd.set("displayName", values.displayName);
    fetcher.submit(fd, { method: "post" });
  };

  return (
    <AuthPageShell
      title="Create your Upano account"
      description="Two short steps. Your audit trail starts the moment your first bug lands."
      altAction={{
        prompt: "Already have an account?",
        linkLabel: "Log in",
        to: "/login",
      }}
    >
      <MultiStepForm<RegisterValues>
        schema={registerSchema}
        defaultValues={{
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
          displayName: "",
        }}
        onSubmit={submitRegister}
        onStepChange={() => {
          if (actionData?.formError) fetcher.load("/register");
        }}
        submitting={submitting}
        labels={{
          finish: "Register",
        }}
        steps={[
          {
            title: "Who are you?",
            description: "These details set up your account.",
            fieldsToValidate: ["name", "email", "password", "confirmPassword"],
            render: (form) => {
              const errors = form.formState.errors;
              const serverFieldErrors = (actionData?.fieldErrors ??
                {}) as Record<string, string[] | undefined>;
              return (
                <>
                  <Field>
                    <FieldLabel htmlFor="reg-name">Full name</FieldLabel>
                    <Input
                      id="reg-name"
                      autoComplete="name"
                      placeholder="John Doe"
                      {...form.register("name")}
                    />
                    <FieldError>
                      {errors.name?.message ?? serverFieldErrors.name?.[0]}
                    </FieldError>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="reg-email">Work email</FieldLabel>
                    <Input
                      id="reg-email"
                      type="email"
                      autoComplete="email"
                      placeholder="johndoe@amazon.com"
                      {...form.register("email")}
                    />
                    <FieldError>
                      {errors.email?.message ?? serverFieldErrors.email?.[0]}
                    </FieldError>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="reg-password">Password</FieldLabel>
                    <Input
                      id="reg-password"
                      type="password"
                      autoComplete="new-password"
                      placeholder="Enter your password"
                      {...form.register("password")}
                    />
                    <FieldError>
                      {errors.password?.message ??
                        serverFieldErrors.password?.[0]}
                    </FieldError>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="reg-confirm">
                      Confirm password
                    </FieldLabel>
                    <Input
                      id="reg-confirm"
                      type="password"
                      autoComplete="new-password"
                      placeholder="Confirm your password"
                      {...form.register("confirmPassword")}
                    />
                    <FieldError>
                      {errors.confirmPassword?.message ??
                        serverFieldErrors.confirmPassword?.[0]}
                    </FieldError>
                  </Field>
                </>
              );
            },
          },
          {
            title: "Last bit",
            description: "How would you like to be shown to your teammates?",
            fieldsToValidate: ["displayName"],
            render: (form) => {
              const errors = form.formState.errors;
              const fallback = form.watch("name");
              return (
                <>
                  <Field>
                    <FieldLabel htmlFor="reg-display">Display name</FieldLabel>
                    <Input
                      id="reg-display"
                      placeholder={fallback || "How your name appears in bugs"}
                      {...form.register("displayName")}
                    />
                    <FieldError>{errors.displayName?.message}</FieldError>
                  </Field>

                  <p className="text-xs text-muted-foreground">
                    Your role starts as{" "}
                    <span className="font-medium">Reporter</span>. An admin can
                    promote you to SDE or Admin once you join a team.
                  </p>
                  {actionData?.formError && (
                    <AuthFormError message={actionData.formError} />
                  )}
                </>
              );
            },
          },
        ]}
      />
    </AuthPageShell>
  );
}
