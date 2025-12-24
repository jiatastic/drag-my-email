"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputOTP } from "@/components/ui/input-otp";
import { useConvexAuth } from "convex/react";

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

  // Convert technical errors to user-friendly messages
  const getErrorMessage = (error: any): string => {
    const errorMessage = error?.message || error?.toString() || "";
    const errorName = error?.name || "";

    if (errorMessage.includes("InvalidAccountId") || errorName === "InvalidAccountId") {
      return "Account not found. Please sign up first.";
    }
    if (errorMessage.includes("InvalidPassword") || errorMessage.includes("invalid password")) {
      return "Incorrect password. Please try again.";
    }
    if (errorMessage.includes("UserNotFound") || errorMessage.includes("user not found")) {
      return "No account found for this email. Please sign up.";
    }
    if (errorMessage.includes("EmailAlreadyExists") || errorMessage.includes("already exists")) {
      return "This email is already registered. Please sign in.";
    }
    if (errorMessage.includes("NetworkError") || errorMessage.includes("fetch")) {
      return "Network error. Check your connection and try again.";
    }
    if (errorMessage.includes("Unauthorized") || errorMessage.includes("401")) {
      return "Sign-in failed. Please verify your email and password.";
    }

    if (errorMessage) {
      return errorMessage;
    }

    return "Sign-in failed. Please try again later.";
  };

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
    } catch (err: any) {
      console.error("Sign in error:", err);
      const friendlyError = getErrorMessage(err);
      setError(friendlyError);
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
    } catch (err: any) {
      console.error("Email verification error:", err);
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Enter your credentials to access your account
        </p>
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

        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
              required
              className="w-full h-10 pl-10 pr-4 rounded-md border border-input bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <Link
              href={`/reset-password?redirect=${encodeURIComponent(redirect)}${isPopup ? "&popup=1" : ""}`}
              className="text-xs text-muted-foreground hover:text-primary"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full h-10 pl-10 pr-4 rounded-md border border-input bg-background text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Signing in...
            </>
          ) : (
            "Sign in"
          )}
        </Button>

        <Button
          type="button"
          variant="outline"
          disabled={isLoading}
          className="w-full"
          onClick={() => void signIn("google", { redirectTo: redirectWithPopup } as any)}
        >
          Continue with Google
        </Button>
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

