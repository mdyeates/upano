/**
 * Server-side theme cookie.
 */
import { createCookie } from "react-router";

export type Theme = "light" | "dark";
/**
 * Cookie used to track which theme the user prefers.
 *
 * `secure: true` only when not in dev so the cookie sticks on
 * localhost over HTTP. On Render the requests are HTTPS so secure
 * applies; without it some browsers/extensions silently drop
 * cookies set without Secure on HTTPS.
 */
const IS_PROD = process.env.NODE_ENV === "production";

export const themeCookie = createCookie("theme", {
  path: "/",
  sameSite: "lax",
  httpOnly: false,
  secure: IS_PROD,
  // 1 year. Theme isn't sensitive
  // and the app doesn't need to know about it server-side.
  maxAge: 60 * 60 * 24 * 365,
});

const isTheme = (value: unknown): value is Theme =>
  value === "light" || value === "dark";

/**
 * Read the theme from the request's Cookie header. Defaults to
 * "light" if the cookie is absent or malformed.
 */
export async function getTheme(request: Request): Promise<Theme> {
  const cookieHeader = request.headers.get("Cookie");
  if (!cookieHeader) return "light";
  const value = await themeCookie.parse(cookieHeader);
  return isTheme(value) ? value : "light";
}
