import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  assertIsDataWithResponseInit,
  assertIsResponse,
  submit,
} from "~/routes/tests/helpers";
import { VALID_PASSWORD, VALID_EMAIL, SESSION_COOKIE } from "./constants";

/**
 * Server-side action tests for /register.
 * These tests validate:
 *   - registerSchema validation (missing fields, bad email, password mismatch)
 *   - Mapped Neon Auth errors (USER_ALREADY_EXISTS = 409, other 4xx > 400)
 *   - Successful sign-up redirects to /dashboard with the session cookie
 */

const { postAuthMock } = vi.hoisted(() => ({ postAuthMock: vi.fn() }));
const { action } = await import("../register");

vi.mock("~/lib/auth/auth.server", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("~/lib/auth/auth.server")>();
  return {
    ...actual,
    postAuth: postAuthMock,
    getSession: vi.fn(async () => null),
  };
});

const post = (fields: Record<string, string>) =>
  submit(action, "http://localhost:3000/register", fields);

const VALID_FIELDS: Record<string, string> = {
  name: "Test User",
  email: VALID_EMAIL,
  password: VALID_PASSWORD,
  confirmPassword: VALID_PASSWORD,
};

beforeEach(() => {
  postAuthMock.mockReset();
});

describe("POST /register action", () => {
  it("returns 400 with field errors when fields are missing", async () => {
    const result = await post({});
    assertIsDataWithResponseInit(result);

    expect(result.init.status).toBe(400);
    const data = result.data as {
      fieldErrors: {
        name?: string[];
        email?: string[];
        password?: string[];
        confirmPassword?: string[];
      };
      formError: string | null;
    };

    expect(data.fieldErrors.name).toBeDefined();
    expect(data.fieldErrors.email).toBeDefined();
    expect(data.fieldErrors.password).toBeDefined();
    expect(data.formError).toBeNull();

    // Zod rejects before postAuth is called.
    expect(postAuthMock).not.toHaveBeenCalled();
  });

  it("returns 400 when email is not valid", async () => {
    const result = await post({
      ...VALID_FIELDS,
      email: "not-an-email",
    });
    assertIsDataWithResponseInit(result);

    expect(result.init.status).toBe(400);
    const data = result.data as { fieldErrors: { email?: string[] } };
    expect(data.fieldErrors.email?.[0]).toMatch(/valid email/i);
    expect(postAuthMock).not.toHaveBeenCalled();
  });

  it("returns 400 when password does not meet validation rules", async () => {
    const result = await post({
      ...VALID_FIELDS,
      password: "weakpass",
      confirmPassword: "weakpass",
    });
    assertIsDataWithResponseInit(result);

    expect(result.init.status).toBe(400);
    const data = result.data as { fieldErrors: { password?: string[] } };
    expect(data.fieldErrors.password?.[0]).toMatch(
      /uppercase|lowercase|number/i,
    );
    expect(postAuthMock).not.toHaveBeenCalled();
  });

  it("returns 400 when password and confirmPassword do not match", async () => {
    const result = await post({
      ...VALID_FIELDS,
      confirmPassword: "DifferentPass1",
    });
    assertIsDataWithResponseInit(result);

    expect(result.init.status).toBe(400);

    const data = result.data as {
      fieldErrors: { confirmPassword?: string[] };
    };

    expect(data.fieldErrors.confirmPassword?.[0]).toMatch(/match/i);
    expect(postAuthMock).not.toHaveBeenCalled();
  });

  it("returns 409 with mapped message when the email already exists", async () => {
    // Neon returns 422 for USER_ALREADY_EXISTS; the action remaps to 409.
    postAuthMock.mockResolvedValueOnce({
      status: 422,
      body: {
        code: "USER_ALREADY_EXISTS",
        message: "User already exists",
      },
      setCookie: null,
    });

    const result = await post(VALID_FIELDS);
    assertIsDataWithResponseInit(result);

    expect(result.init.status).toBe(409);
    const data = result.data as { formError: string };
    expect(data.formError).toMatch(/already exists/i);
    expect(postAuthMock).toHaveBeenCalledOnce();
  });

  it("returns 400 with mapped message on other upstream auth errors", async () => {
    postAuthMock.mockResolvedValueOnce({
      status: 400,
      body: {
        code: "PASSWORD_TOO_SHORT",
        message: "Password too short",
      },
      setCookie: null,
    });

    const result = await post(VALID_FIELDS);
    assertIsDataWithResponseInit(result);

    expect(result.init.status).toBe(400);
    const data = result.data as { formError: string };
    expect(data.formError).toMatch(/at least 8 characters/i);
  });

  it("redirects to /dashboard with the session cookie on success", async () => {
    postAuthMock.mockResolvedValueOnce({
      status: 200,
      body: { user: { id: "user", email: VALID_EMAIL } },
      setCookie: SESSION_COOKIE,
    });

    const result = await post(VALID_FIELDS);

    assertIsResponse(result);
    expect(result.status).toBe(302);
    expect(result.headers.get("location")).toBe("/dashboard");
    expect(result.headers.get("set-cookie")).toBe(SESSION_COOKIE);
    expect(postAuthMock).toHaveBeenCalledOnce();
    const [, path, body] = postAuthMock.mock.calls[0];
    expect(path).toBe("/sign-up/email");
    expect(body).toEqual({
      email: VALID_EMAIL,
      password: VALID_PASSWORD,
      name: "Test User",
    });
  });
});
