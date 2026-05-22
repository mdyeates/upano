import { data } from "react-router";
import {
  DomainError,
  ForbiddenError,
  InvalidStateTransitionError,
  NotFoundError,
  SelfDemotionError,
  ValidationError,
} from "./_errors";

/**
 * Convert a thrown domain error to an RR7 action response. Returns
 * `null` when the error isn't a domain error, the caller should
 * re-throw to surface as an unexpected 500 via RR7's error boundary.
 */
export function domainErrorToResponse(err: unknown) {
  if (err instanceof InvalidStateTransitionError) {
    return data(
      {
        ok: false as const,
        error: err.message,
        allowed: err.allowed,
      },
      { status: 409 },
    );
  }
  if (err instanceof ForbiddenError) {
    return data({ ok: false as const, error: err.message }, { status: 403 });
  }
  if (err instanceof NotFoundError) {
    return data({ ok: false as const, error: err.message }, { status: 404 });
  }
  if (err instanceof SelfDemotionError) {
    return data(
      { ok: false as const, error: err.message, fieldErrors: null },
      { status: 400 },
    );
  }
  if (err instanceof ValidationError) {
    return data(
      {
        ok: false as const,
        error: err.message,
        field: err.field ?? null,
      },
      { status: 400 },
    );
  }
  // Generic domain error, default to 400.
  if (err instanceof DomainError) {
    return data({ ok: false as const, error: err.message }, { status: 400 });
  }
  return null;
}
