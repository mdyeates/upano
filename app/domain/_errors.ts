/**
 * Shared domain error classes for the service layer.
 */

export class DomainError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "DomainError";
  }
}

/**
 * Caller is authenticated but not authorised to perform this action.
 * Maps to 403 Forbidden.
 */
export class ForbiddenError extends DomainError {
  constructor(message = "Forbidden") {
    super("FORBIDDEN", message);
    this.name = "ForbiddenError";
  }
}

/**
 * Resource doesn't exist OR caller can't see it.
 * Maps to 404 Not found.
 *
 * When a Reporter targets a bug they don't own,
 * we throw NotFoundError (not ForbiddenError)
 * to avoid leaking the existence of bugs they shouldn't know about.
 */
export class NotFoundError extends DomainError {
  constructor(message = "Not found") {
    super("NOT_FOUND", message);
    this.name = "NotFoundError";
  }
}

/**
 * Input failed business validation (zod validation lives in the
 * action layer; this is for rules that depend on application state).
 * Maps to 400 Bad Request.
 */
export class ValidationError extends DomainError {
  constructor(
    message: string,
    public readonly field?: string,
  ) {
    super("VALIDATION", message);
    this.name = "ValidationError";
  }
}

/**
 * Admin attempted to demote themselves. Specific case so the route
 * can give a tailored error message.
 * Maps to 400 Bad Request.
 */
export class SelfDemotionError extends DomainError {
  constructor() {
    super(
      "SELF_DEMOTION",
      "You cannot demote yourself. Promote another admin first, then have them change your role.",
    );
    this.name = "SelfDemotionError";
  }
}

/**
 * State machine rejected the requested transition. Carries the list
 * of allowed transitions so the route can surface them to the client.
 * Maps to 409 Conflict.
 */
export class InvalidStateTransitionError extends DomainError {
  constructor(
    message: string,
    public readonly allowed: string[],
  ) {
    super("INVALID_TRANSITION", message);
    this.name = "InvalidStateTransitionError";
  }
}
