import {
  type RouteConfig,
  index,
  layout,
  route,
} from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("login", "routes/login.tsx"),
  route("register", "routes/register.tsx"),
  route("logout", "routes/logout.tsx"),

  // Auth required routes.
  layout("routes/_authed.tsx", [
    route("dashboard", "routes/dashboard.tsx"),
    route("bugs", "routes/bug-list.tsx"),
    route("bugs/new", "routes/bug-new.tsx"),
    route("bugs/:id", "routes/bug-detail.tsx"),
    route("admin", "routes/admin.tsx"),
  ]),
  route("theme", "routes/theme.ts"),
] satisfies RouteConfig;
