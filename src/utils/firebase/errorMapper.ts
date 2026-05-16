export function mapFirebaseAuthError(error: unknown): string {
  if (typeof error !== "object" || error === null || !("code" in error)) {
    return "Something went wrong. Please try again.";
  }

  const code = (error as any).code;

  switch (code) {
    // Login (generic for security)
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Incorrect email or password.";

    // Validation
    case "auth/invalid-email":
      return "Invalid email format.";

    // Register
    case "auth/email-already-in-use":
      return "This email is already registered.";

    case "auth/weak-password":
      return "Password must be at least 6 characters.";

    // System
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";

    case "auth/network-request-failed":
      return "Network error. Check your connection.";

    case "auth/missing-email":
      return "Please enter your email address.";

    default:
      return "Operation failed. Please try again.";
  }
}