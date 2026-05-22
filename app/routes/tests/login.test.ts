import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  assertIsDataWithResponseInit,
  assertIsResponse,
  submit,
} from "~/routes/tests/helpers";
import { action } from "../login";
import { VALID_PASSWORD, VALID_EMAIL, SESSION_COOKIE } from "./constants";

/**
 * Server-side action tests for /login.
 * These tests validate:
 *   - Request data validation
 *   - Handling of auth service responses
 *   - Session cookie handling
 *   - Redirects after login
 *   - Error responses and display
 */

const post = (fields: Record<string, string>) =>
  submit(action, "http://localhost:3000/login", fields);
const { postAuthMock } = vi.hoisted(() => ({ postAuthMock: vi.fn() }));
vi.mock("~/lib/auth/auth.server", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("~/lib/auth/auth.server")>();
  return {
    ...actual,
    postAuth: postAuthMock,
    getSession: vi.fn(async () => null),
  };
});

beforeEach(() => {
  postAuthMock.mockReset();
});

describe("POST /login action", () => {
  it("returns 400 with field errors when missing", async () => {
    const result = await post({});
    assertIsDataWithResponseInit(result);

    expect(result.init.status).toBe(400);
    const data = result.data as {
      fieldErrors: { email?: string[]; password?: string[] };
      formError: string | null;
    };

    expect(data.fieldErrors.email).toBeDefined();
    expect(data.fieldErrors.password).toBeDefined();
    expect(data.formError).toBeNull();

    // Zod validation rejects before postAuth is called.
    expect(postAuthMock).not.toHaveBeenCalled();
  });

  it("returns 400 when email is not valid", async () => {
    const result = await post({
      email: "not-an-email",
      password: VALID_PASSWORD,
    });
    assertIsDataWithResponseInit(result);

    const data = result.data as { fieldErrors: { email?: string[] } };

    expect(result.init.status).toBe(400);
    expect(data.fieldErrors.email?.[0]).toMatch(/valid email/i);
    expect(postAuthMock).not.toHaveBeenCalled();
  });

  it("returns 401 with a user-friendly message when Neon rejects credentials", async () => {
    postAuthMock.mockResolvedValueOnce({
      status: 401,
      body: {
        code: "INVALID_EMAIL_OR_PASSWORD",
        message: "Invalid email or password",
      },
      setCookie: null,
    });

    const result = await post({
      email: VALID_EMAIL,
      password: "WrongPass1",
    });
    assertIsDataWithResponseInit(result);

    expect(result.init.status).toBe(401);
    const data = result.data as { formError: string };
    expect(data.formError).toMatch(/incorrect/i);
    expect(postAuthMock).toHaveBeenCalledOnce();
  });

  it("redirects to /dashboard with the session cookie on success", async () => {
    postAuthMock.mockResolvedValueOnce({
      status: 200,
      body: { user: { id: "user", email: VALID_EMAIL } },
      setCookie: SESSION_COOKIE,
    });

    const result = await post({
      email: VALID_EMAIL,
      password: VALID_PASSWORD,
    });

    assertIsResponse(result);
    expect(result.status).toBe(302);
    expect(result.headers.get("location")).toBe("/dashboard");
    expect(result.headers.get("set-cookie")).toBe(SESSION_COOKIE);
  });
});
