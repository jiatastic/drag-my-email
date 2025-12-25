"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputOTP } from "@/components/ui/input-otp";
import { useConvexAuth } from "convex/react";
import { getAuthErrorMessage } from "@/lib/auth-errors";

export function LoginForm() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"signIn" | { email: string }>("signIn");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const redirect = useMemo(() => searchParams.get("redirect") || "/builder", [searchParams]);
  const isPopup = useMemo(() => searchParams.get("popup") === "1", [searchParams]);
  const isAuthenticatedRef = useRef(isAuthenticated);
  useEffect(() => {
    isAuthenticatedRef.current = isAuthenticated;
  }, [isAuthenticated]);

  const redirectWithPopup = useMemo(() => {
    if (!isPopup) return redirect;
    const hasQuery = redirect.includes("?");
    return `${redirect}${hasQuery ? "&" : "?"}popup=1`;
  }, [redirect, isPopup]);

  const finishRedirect = () => {
    if (isPopup && typeof window !== "undefined" && window.opener) {
      try {
        const target = new URL(redirect, window.location.origin).toString();
        window.opener.location.href = target;
        window.close();
        return;
      } catch {
        // fall back to in-window redirect
      }
    }
    router.push(redirect);
  };

  // Redirect as soon as auth is established (covers email verification + password reset-verification).
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      finishRedirect();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      await signIn("password", { email, password, flow: "signIn" });
      // If the account requires email verification, Convex Auth will send a code
      // and we should prompt for it instead of redirecting.
      const stepEmail = email;
      setTimeout(() => {
        if (!isAuthenticatedRef.current) {
          setStep({ email: stepEmail });
        }
      }, 150);
    } catch (err: unknown) {
      console.error("Sign in error:", err);
      setError(getAuthErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === "signIn") return;
    setError(null);
    setIsLoading(true);
    try {
      await signIn("password", { email: step.email, code: otp, flow: "email-verification" });
      // Redirect is handled by the auth effect once session is established.
    } catch (err: unknown) {
      console.error("Email verification error:", err);
      setError(getAuthErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="text-sm text-muted-foreground">Sign in to continue building emails.</p>
      </div>

      {step === "signIn" ? (
        <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="flex items-start gap-2 p-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium mb-1">Sign-in failed</p>
              <p className="text-muted-foreground">{error}</p>
            </div>
          </div>
        )}

        <Button
          type="button"
          variant="outline"
          disabled={isLoading}
          className="w-full h-11 rounded-full justify-center gap-2"
          onClick={() => void signIn("google", { redirectTo: redirectWithPopup } as any)}
        >
          <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
            <path
              fill="#FFC107"
              d="M43.611 20.083H42V20H24v8h11.303C33.49 32.657 29.152 36 24 36c-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.843 1.154 7.962 3.038l5.657-5.657C34.047 6.053 29.281 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"
            />
            <path
              fill="#FF3D00"
              d="M6.306 14.691l6.571 4.819C14.655 16.109 19.002 12 24 12c3.059 0 5.843 1.154 7.962 3.038l5.657-5.657C34.047 6.053 29.281 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"
            />
            <path
              fill="#4CAF50"
              d="M24 44c5.178 0 9.86-1.981 13.409-5.197l-6.19-5.238C29.221 35.091 26.715 36 24 36c-5.132 0-9.457-3.317-11.271-7.946l-6.52 5.02C9.51 39.556 16.227 44 24 44z"
            />
            <path
              fill="#1976D2"
              d="M43.611 20.083H42V20H24v8h11.303c-.865 2.299-2.514 4.243-4.684 5.565l.003-.002 6.19 5.238C36.373 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"
            />
          </svg>
          Continue with Google
        </Button>

        <div className="relative">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-background px-2 text-muted-foreground">or</span>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="sr-only">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter email"
            autoComplete="email"
            required
            className="w-full h-11 px-4 rounded-xl border border-input bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-end">
            <Link
              href={`/reset-password?redirect=${encodeURIComponent(redirect)}${isPopup ? "&popup=1" : ""}`}
              className="text-xs text-muted-foreground hover:text-primary"
            >
              Forgot password?
            </Link>
          </div>
          <label htmlFor="password" className="sr-only">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete="current-password"
            required
            className="w-full h-11 px-4 rounded-xl border border-input bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 rounded-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Continuing...
            </>
          ) : (
            "Continue"
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          By continuing, you agree to our{" "}
          <Link href="/terms" className="underline underline-offset-4 hover:text-foreground">
            Terms
          </Link>{" "}
          and{" "}
          <Link href="/privacy" className="underline underline-offset-4 hover:text-foreground">
            Privacy Policy
          </Link>
          .
        </p>
      </form>
      ) : (
        <form onSubmit={handleVerifyEmail} className="space-y-4">
          {error && (
            <div className="flex items-start gap-2 p-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-medium mb-1">Verification failed</p>
                <p className="text-muted-foreground">{error}</p>
              </div>
            </div>
          )}

          <div className="space-y-2 text-center">
            <p className="text-sm font-medium">Check your email</p>
            <p className="text-xs text-muted-foreground">
              We sent a 6-digit code to <span className="font-medium">{step.email}</span>
            </p>
          </div>

          <div className="flex justify-center">
            <InputOTP value={otp} onChange={setOtp} />
          </div>

          <Button type="submit" disabled={isLoading || otp.replace(/\D/g, "").length < 6} className="w-full">
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Verify & continue"
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full"
            disabled={isLoading}
            onClick={() => {
              setOtp("");
              setStep("signIn");
            }}
          >
            Back to sign in
          </Button>
        </form>
      )}

      <div className="text-center text-sm">
        <span className="text-muted-foreground">Don't have an account? </span>
        <Link href="/signup" className="text-primary hover:underline font-medium">
          Sign up
        </Link>
      </div>
    </div>
  );
}

