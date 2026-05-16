import { data, redirect, useFetcher } from "react-router";

import { AuthFormError, AuthPageShell } from "~/components/auth/auth-shell";
import { Field, FieldError, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { MultiStepForm } from "~/components/uselayouts/multi-step-form";
import { LOGIN_COPY } from "~/content/auth";
import { loginSchema, type LoginValues } from "~/lib/auth/auth-schemas";
import {
  authCookieHeaders,
  getSession,
  mapAuthError,
  postAuth,
} from "~/lib/auth/auth.server";

import type { Route } from "./+types/login";

export function meta(_: Route.MetaArgs) {
  return [
    { title: LOGIN_COPY.meta.title },
    { name: "description", content: LOGIN_COPY.meta.description },
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

  const parsed = loginSchema.safeParse({
    email: formData.get("email") || undefined,
    password: formData.get("password") || undefined,
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

  const { status, body, setCookie } = await postAuth(
    request,
    "/sign-in/email",
    parsed.data,
  );

  // Maps neon error messages to user-friendly versions
  if (status >= 400) {
    const mapped = mapAuthError(status, body);
    return data(
      { fieldErrors: {}, formError: mapped.message },
      { status: 401 },
    );
  }

  const next = formData.get("next");
  const target = typeof next === "string" && next ? next : "/dashboard";
  return redirect(target, { headers: authCookieHeaders(setCookie) });
}

export default function LoginPage() {
  const fetcher = useFetcher<typeof action>();
  const submitting = fetcher.state === "submitting";
  const actionData = fetcher.data;

  const formError = actionData?.formError;

  const submitLogin = (values: LoginValues) => {
    const fd = new FormData();
    fd.set("email", values.email);
    fd.set("password", values.password);
    fetcher.submit(fd, { method: "post" });
  };

  return (
    <AuthPageShell
      title={LOGIN_COPY.shell.title}
      description={LOGIN_COPY.shell.description}
      altAction={LOGIN_COPY.shell.altAction}
    >
      <MultiStepForm<LoginValues>
        schema={loginSchema}
        defaultValues={{ email: "", password: "" }}
        onSubmit={submitLogin}
        onStepChange={() => {
          if (actionData?.formError) fetcher.load("/login");
        }}
        submitting={submitting}
        labels={{
          finish: LOGIN_COPY.submitLabel,
        }}
        steps={[
          {
            title: LOGIN_COPY.step.title,
            description: LOGIN_COPY.step.description,
            render: (form) => {
              const errors = form.formState.errors;
              const serverFieldErrors = (actionData?.fieldErrors ??
                {}) as Record<string, string[] | undefined>;
              return (
                <>
                  <Field>
                    <FieldLabel htmlFor="login-email">
                      {LOGIN_COPY.fields.email.label}
                    </FieldLabel>
                    <Input
                      id="login-email"
                      type="email"
                      autoComplete="email"
                      placeholder={LOGIN_COPY.fields.email.placeholder}
                      {...form.register("email")}
                    />
                    <FieldError>
                      {errors.email?.message ?? serverFieldErrors.email?.[0]}
                    </FieldError>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="login-password">
                      {LOGIN_COPY.fields.password.label}
                    </FieldLabel>
                    <Input
                      id="login-password"
                      type="password"
                      autoComplete="current-password"
                      placeholder={LOGIN_COPY.fields.password.placeholder}
                      {...form.register("password")}
                    />
                    <FieldError>
                      {errors.password?.message ??
                        serverFieldErrors.password?.[0]}
                    </FieldError>
                  </Field>
                  {formError && <AuthFormError message={formError} />}
                </>
              );
            },
          },
        ]}
      />
    </AuthPageShell>
  );
}
