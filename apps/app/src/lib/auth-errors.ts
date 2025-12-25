/**
 * Authentication Error Utilities
 * 
 * This module provides utilities for converting technical authentication errors
 * from Convex Auth into human-readable messages.
 */

/**
 * Human-readable error messages for authentication errors.
 */
export const AUTH_ERROR_MESSAGES = {
  // Sign in errors
  INVALID_ACCOUNT: "Account not found. Please check your email or sign up for a new account.",
  INVALID_PASSWORD: "Incorrect password. Please try again or reset your password.",
  INVALID_CREDENTIALS: "Invalid email or password. Please try again.",

  // Sign up errors
  EMAIL_EXISTS: "This email is already registered. Please sign in or use a different email.",
  INVALID_EMAIL: "Invalid email format. Please enter a valid email address.",

  // Password errors
  PASSWORD_TOO_SHORT: "Password must be at least 8 characters long.",
  PASSWORD_TOO_WEAK: "Password is too weak. Use a mix of letters, numbers, and symbols.",
  PASSWORDS_DONT_MATCH: "Passwords do not match. Please try again.",

  // Verification errors
  INVALID_CODE: "Invalid verification code. Please check and try again.",
  CODE_EXPIRED: "Verification code has expired. Please request a new one.",
  TOO_MANY_ATTEMPTS: "Too many failed attempts. Please wait a few minutes and try again.",

  // Session errors
  SESSION_EXPIRED: "Your session has expired. Please sign in again.",
  UNAUTHORIZED: "You are not authorized to perform this action.",

  // Network errors
  NETWORK_ERROR: "Network error. Please check your connection and try again.",

  // Generic errors
  UNKNOWN_ERROR: "An unexpected error occurred. Please try again later.",
} as const;

export type AuthErrorCode = keyof typeof AUTH_ERROR_MESSAGES;

/**
 * Error pattern mapping for identifying error types from error messages.
 */
const ERROR_PATTERNS: Array<{ pattern: RegExp; code: AuthErrorCode }> = [
  // Account errors
  { pattern: /InvalidAccountId/i, code: "INVALID_ACCOUNT" },
  { pattern: /account.*not.*found/i, code: "INVALID_ACCOUNT" },
  { pattern: /no.*account.*found/i, code: "INVALID_ACCOUNT" },
  { pattern: /user.*not.*found/i, code: "INVALID_ACCOUNT" },
  
  // Password errors
  { pattern: /InvalidPassword/i, code: "INVALID_PASSWORD" },
  { pattern: /wrong.*password/i, code: "INVALID_PASSWORD" },
  { pattern: /incorrect.*password/i, code: "INVALID_PASSWORD" },
  { pattern: /invalid.*password/i, code: "INVALID_PASSWORD" },
  
  // Email exists
  { pattern: /EmailAlreadyExists/i, code: "EMAIL_EXISTS" },
  { pattern: /already.*exists/i, code: "EMAIL_EXISTS" },
  { pattern: /already.*registered/i, code: "EMAIL_EXISTS" },
  { pattern: /email.*in.*use/i, code: "EMAIL_EXISTS" },
  
  // Invalid email
  { pattern: /InvalidEmail/i, code: "INVALID_EMAIL" },
  { pattern: /invalid.*email.*format/i, code: "INVALID_EMAIL" },
  
  // Password requirements
  { pattern: /password.*must.*be.*at.*least.*8/i, code: "PASSWORD_TOO_SHORT" },
  { pattern: /password.*short/i, code: "PASSWORD_TOO_SHORT" },
  { pattern: /password.*length/i, code: "PASSWORD_TOO_SHORT" },
  { pattern: /password.*weak/i, code: "PASSWORD_TOO_WEAK" },
  
  // Verification code
  { pattern: /InvalidVerificationCode/i, code: "INVALID_CODE" },
  { pattern: /invalid.*code/i, code: "INVALID_CODE" },
  { pattern: /verification.*failed/i, code: "INVALID_CODE" },
  { pattern: /code.*expired/i, code: "CODE_EXPIRED" },
  { pattern: /token.*expired/i, code: "CODE_EXPIRED" },
  
  // Rate limiting
  { pattern: /too.*many.*attempts/i, code: "TOO_MANY_ATTEMPTS" },
  { pattern: /rate.*limit/i, code: "TOO_MANY_ATTEMPTS" },
  { pattern: /try.*again.*later/i, code: "TOO_MANY_ATTEMPTS" },
  
  // Session
  { pattern: /session.*expired/i, code: "SESSION_EXPIRED" },
  { pattern: /unauthorized/i, code: "UNAUTHORIZED" },
  { pattern: /401/i, code: "UNAUTHORIZED" },
  
  // Network
  { pattern: /network.*error/i, code: "NETWORK_ERROR" },
  { pattern: /fetch.*failed/i, code: "NETWORK_ERROR" },
  { pattern: /connection.*failed/i, code: "NETWORK_ERROR" },
  { pattern: /ECONNREFUSED/i, code: "NETWORK_ERROR" },
];

/**
 * Extracts a string representation from various error types.
 */
function extractErrorString(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name} ${error.message}`;
  }
  if (typeof error === "string") {
    return error;
  }
  if (error && typeof error === "object") {
    const obj = error as Record<string, unknown>;
    // Handle ConvexError structure
    if ("data" in obj) {
      if (typeof obj.data === "string") {
        return obj.data;
      }
      if (obj.data && typeof obj.data === "object") {
        const data = obj.data as Record<string, unknown>;
        if ("message" in data && typeof data.message === "string") {
          return data.message;
        }
      }
    }
    if ("message" in obj && typeof obj.message === "string") {
      return obj.message;
    }
  }
  return String(error);
}

/**
 * Identifies the error code from an error object or string.
 */
export function identifyAuthError(error: unknown): AuthErrorCode {
  const errorString = extractErrorString(error);
  
  for (const { pattern, code } of ERROR_PATTERNS) {
    if (pattern.test(errorString)) {
      return code;
    }
  }
  
  return "UNKNOWN_ERROR";
}

/**
 * Gets a human-readable error message from an authentication error.
 * 
 * @param error - The error object or string to parse
 * @returns A human-readable error message
 * 
 * @example
 * ```ts
 * try {
 *   await signIn("password", { email, password, flow: "signIn" });
 * } catch (error) {
 *   const message = getAuthErrorMessage(error);
 *   setError(message);
 * }
 * ```
 */
export function getAuthErrorMessage(error: unknown): string {
  // First, check if the error already contains a friendly message
  const errorString = extractErrorString(error);
  
  // If the error message already looks user-friendly (not a technical error),
  // return it directly
  const technicalPatterns = [
    /Error:/i,
    /Exception/i,
    /at\s+\w+/i,
    /node_modules/i,
    /\.ts:/i,
    /\.js:/i,
  ];
  
  const isTechnical = technicalPatterns.some(p => p.test(errorString));
  
  if (!isTechnical && errorString.length > 0 && errorString.length < 200) {
    // Check if it's one of our predefined messages (already friendly)
    const isKnownMessage = Object.values(AUTH_ERROR_MESSAGES).includes(errorString as any);
    if (isKnownMessage) {
      return errorString;
    }
  }
  
  // Identify and return the appropriate message
  const code = identifyAuthError(error);
  return AUTH_ERROR_MESSAGES[code];
}

/**
 * Checks if an error is a specific type of authentication error.
 */
export function isAuthError(error: unknown, code: AuthErrorCode): boolean {
  return identifyAuthError(error) === code;
}
