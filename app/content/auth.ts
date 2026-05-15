// =============================================================================
// Login
// =============================================================================

export const LOGIN_COPY = {
  meta: {
    title: "Upano - Login",
    description: "Log in to Upano.",
  },
  shell: {
    title: "Welcome back",
    description: "Log in to your Upano account.",
    altAction: {
      prompt: "Need an account?",
      linkLabel: "Create one",
      to: "/register",
    },
  },
  submitLabel: "Login",
  step: {
    title: "Sign in",
    description: "Use your work email and password.",
  },
  fields: {
    email: {
      label: "Work email",
      placeholder: "johndoe@amazon.com",
    },
    password: {
      label: "Password",
      placeholder: "Enter your password",
    },
  },
} as const;

// =============================================================================
// Register
// =============================================================================

export const REGISTER_COPY = {
  meta: {
    title: "Register \u2014 Upano",
    description: "Create an Upano account for your Amazon team.",
  },
  shell: {
    title: "Create your Upano account",
    description:
      "Two short steps. Your audit trail starts the moment your first bug lands.",
    altAction: {
      prompt: "Already have an account?",
      linkLabel: "Log in",
      to: "/login",
    },
  },
  submitLabel: "Register",
  steps: {
    profile: {
      title: "Who are you?",
      description: "These details set up your account.",
    },
    display: {
      title: "Last bit",
      description: "How would you like to be shown to your teammates?",
    },
  },
  fields: {
    name: { label: "Full name", placeholder: "John Doe" },
    email: { label: "Work email", placeholder: "johndoe@amazon.com" },
    password: { label: "Password", placeholder: "Enter your password" },
    confirmPassword: {
      label: "Confirm password",
      placeholder: "Confirm your password",
    },
    displayName: {
      label: "Display name",
      placeholder: "How your name appears in bugs",
    },
  },
  roleExplainer: {
    prefix: "Your role starts as ",
    role: "Reporter",
    suffix: ". An admin can promote you to SDE or Admin once you join a team.",
  },
} as const;
