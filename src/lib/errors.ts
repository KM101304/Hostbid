export function logDevelopmentError(scope: string, error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.error(`[${scope}]`, error);
  }
}

export function getFriendlyAuthError(message: string | undefined, fallback = "We could not complete that auth request. Please try again.") {
  const normalized = message?.toLowerCase() ?? "";

  if (normalized.includes("email not confirmed")) {
    return "Confirm your email from the message we sent, then come back and log in.";
  }

  if (normalized.includes("invalid login credentials") || normalized.includes("invalid credentials")) {
    return "Email or password is incorrect.";
  }

  if (normalized.includes("already registered") || normalized.includes("already exists") || normalized.includes("user already")) {
    return "An account with this email already exists. Log in or reset your password.";
  }

  if (normalized.includes("weak password") || normalized.includes("password")) {
    return "Use a stronger password with at least 8 characters.";
  }

  if (normalized.includes("rate limit") || normalized.includes("too many")) {
    return "Too many attempts. Please wait a minute before trying again.";
  }

  if (normalized.includes("resend") || normalized.includes("email")) {
    return "We could not send that email right now. Please try again.";
  }

  return fallback;
}
