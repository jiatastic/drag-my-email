import { convexAuth } from "@convex-dev/auth/server";
import { Password } from "@convex-dev/auth/providers/Password";
import Google from "@auth/core/providers/google";
import { ResendOTPPasswordReset, ResendOTPVerify } from "./resendOtp";

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    Google,
    Password({
      verify: ResendOTPVerify,
      reset: ResendOTPPasswordReset,
    }),
  ],
});
