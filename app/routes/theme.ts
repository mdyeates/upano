import { data } from "react-router";
import { themeCookie } from "~/lib/theme/theme.server";
import type { Route } from "./+types/theme";

/**
 * Resource route: persists the user's theme preference to a cookie.
 */

const isTheme = (v: unknown): v is "light" | "dark" =>
  v === "light" || v === "dark";

export async function action({ request }: Route.ActionArgs) {
  const formData = await request.formData();
  const theme = formData.get("theme");
  if (!isTheme(theme)) {
    return data({ ok: false, error: "Invalid theme" }, { status: 400 });
  }
  return data(
    { ok: true, theme },
    {
      status: 200,
      headers: {
        "Set-Cookie": await themeCookie.serialize(theme),
      },
    },
  );
}

export async function loader() {
  return data({ ok: true });
}
