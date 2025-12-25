import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import Google from "@auth/core/providers/google";
import { ConvexError } from "convex/values";
import { ResendOTPPasswordReset, ResendOTPVerify } from "./resendOtp";
import type { DataModel } from "./_generated/dataModel";

/**
 * Human-readable error messages for authentication errors.
 * These replace the cryptic internal error codes from Convex Auth.
 */
const AUTH_ERRORS = {
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
  
  // Verification errors
  INVALID_CODE: "Invalid verification code. Please check and try again.",
  CODE_EXPIRED: "Verification code has expired. Please request a new one.",
  
  // Generic errors
  UNKNOWN_ERROR: "An unexpected error occurred. Please try again later.",
} as const;

/**
 * Converts internal auth errors to user-friendly messages.
 */
function getFriendlyAuthError(error: unknown): string {
  const errorStr = error instanceof Error 
    ? `${error.name} ${error.message}` 
    : String(error);
  
  // Map internal error patterns to friendly messages
  if (/InvalidAccountId/i.test(errorStr) || /account.*not.*found/i.test(errorStr)) {
    return AUTH_ERRORS.INVALID_ACCOUNT;
  }
  if (/InvalidPassword/i.test(errorStr) || /wrong.*password/i.test(errorStr) || /incorrect.*password/i.test(errorStr)) {
    return AUTH_ERRORS.INVALID_PASSWORD;
  }
  if (/EmailAlreadyExists/i.test(errorStr) || /already.*exists/i.test(errorStr) || /already.*registered/i.test(errorStr)) {
    return AUTH_ERRORS.EMAIL_EXISTS;
  }
  if (/InvalidEmail/i.test(errorStr) || /invalid.*email/i.test(errorStr)) {
    return AUTH_ERRORS.INVALID_EMAIL;
  }
  if (/password.*short/i.test(errorStr) || /password.*length/i.test(errorStr)) {
    return AUTH_ERRORS.PASSWORD_TOO_SHORT;
  }
  if (/password.*weak/i.test(errorStr)) {
    return AUTH_ERRORS.PASSWORD_TOO_WEAK;
  }
  if (/invalid.*code/i.test(errorStr) || /verification.*code.*invalid/i.test(errorStr) || /InvalidVerificationCode/i.test(errorStr)) {
    return AUTH_ERRORS.INVALID_CODE;
  }
  if (/code.*expired/i.test(errorStr) || /token.*expired/i.test(errorStr)) {
    return AUTH_ERRORS.CODE_EXPIRED;
  }
  
  // If no specific pattern matched, return the original message if it looks user-friendly,
  // otherwise return a generic error
  if (error instanceof Error && error.message && !error.message.includes("Error:") && error.message.length < 200) {
    return error.message;
  }
  
  return AUTH_ERRORS.UNKNOWN_ERROR;
}

/**
 * Custom Password provider with enhanced error handling.
 */
const CustomPassword = Password<DataModel>({
  // Validate password requirements with friendly error messages
  validatePasswordRequirements: (password: string) => {
    if (!password || password.length < 8) {
      throw new ConvexError(AUTH_ERRORS.PASSWORD_TOO_SHORT);
    }
  },
  
  // Custom profile extraction
  profile(params) {
    return {
      email: params.email as string,
      name: (params.name as string) || undefined,
    };
  },
  
  // Email verification provider
  verify: ResendOTPVerify,
  
  // Password reset provider
  reset: ResendOTPPasswordReset,
});

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Google,
    CustomPassword,
  ],
  callbacks: {
    // Custom redirect callback for validation
    async redirect({ redirectTo }) {
      // Allow any valid URL for now, but you can add validation here
      return redirectTo;
    },
  },
});

// Export error utilities for use in other parts of the app
export { getFriendlyAuthError, AUTH_ERRORS };
