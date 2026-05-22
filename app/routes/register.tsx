import { data, redirect, useFetcher } from "react-router";

import { AuthFormError, AuthPageShell } from "~/components/auth/auth-shell";
import { Field, FieldError, FieldLabel } from "~/components/ui/field";
import { Input } from "~/components/ui/input";
import { MultiStepForm } from "~/components/uselayouts/multi-step-form";
import { REGISTER_COPY } from "~/content/auth";
import { registerSchema, type RegisterValues } from "~/lib/auth/auth-schemas";
import {
  authCookieHeaders,
  getSession,
  mapAuthError,
  postAuth,
} from "~/lib/auth/auth.server";

import type { Route } from "./+types/register";

export function meta(_: Route.MetaArgs) {
  return [
    { title: REGISTER_COPY.meta.title },
    { name: "description", content: REGISTER_COPY.meta.description },
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
      title={REGISTER_COPY.shell.title}
      description={REGISTER_COPY.shell.description}
      altAction={REGISTER_COPY.shell.altAction}
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
          finish: REGISTER_COPY.submitLabel,
        }}
        steps={[
          {
            title: REGISTER_COPY.steps.profile.title,
            description: REGISTER_COPY.steps.profile.description,
            fieldsToValidate: ["name", "email", "password", "confirmPassword"],
            render: (form) => {
              const errors = form.formState.errors;
              const serverFieldErrors = (actionData?.fieldErrors ??
                {}) as Record<string, string[] | undefined>;
              return (
                <>
                  <Field>
                    <FieldLabel htmlFor="reg-name">
                      {REGISTER_COPY.fields.name.label}
                    </FieldLabel>
                    <Input
                      id="reg-name"
                      autoComplete="name"
                      placeholder={REGISTER_COPY.fields.name.placeholder}
                      {...form.register("name")}
                    />
                    <FieldError>
                      {errors.name?.message ?? serverFieldErrors.name?.[0]}
                    </FieldError>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="reg-email">
                      {REGISTER_COPY.fields.email.label}
                    </FieldLabel>
                    <Input
                      id="reg-email"
                      type="email"
                      autoComplete="email"
                      placeholder={REGISTER_COPY.fields.email.placeholder}
                      {...form.register("email")}
                    />
                    <FieldError>
                      {errors.email?.message ?? serverFieldErrors.email?.[0]}
                    </FieldError>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="reg-password">
                      {REGISTER_COPY.fields.password.label}
                    </FieldLabel>
                    <Input
                      id="reg-password"
                      type="password"
                      autoComplete="new-password"
                      placeholder={REGISTER_COPY.fields.password.placeholder}
                      {...form.register("password")}
                    />
                    <FieldError>
                      {errors.password?.message ??
                        serverFieldErrors.password?.[0]}
                    </FieldError>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="reg-confirm">
                      {REGISTER_COPY.fields.confirmPassword.label}
                    </FieldLabel>
                    <Input
                      id="reg-confirm"
                      type="password"
                      autoComplete="new-password"
                      placeholder={
                        REGISTER_COPY.fields.confirmPassword.placeholder
                      }
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
            title: REGISTER_COPY.steps.display.title,
            description: REGISTER_COPY.steps.display.description,
            fieldsToValidate: ["displayName"],
            render: (form) => {
              const errors = form.formState.errors;
              const fallback = form.watch("name");
              return (
                <>
                  <Field>
                    <FieldLabel htmlFor="reg-display">
                      {REGISTER_COPY.fields.displayName.label}
                    </FieldLabel>
                    <Input
                      id="reg-display"
                      placeholder={
                        fallback || REGISTER_COPY.fields.displayName.placeholder
                      }
                      {...form.register("displayName")}
                    />
                    <FieldError>{errors.displayName?.message}</FieldError>
                  </Field>

                  <p className="text-xs text-muted-foreground">
                    {REGISTER_COPY.roleExplainer.prefix}
                    <span className="font-medium">
                      {REGISTER_COPY.roleExplainer.role}
                    </span>
                    {REGISTER_COPY.roleExplainer.suffix}
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
