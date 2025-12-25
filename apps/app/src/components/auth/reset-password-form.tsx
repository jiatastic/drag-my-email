"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { AlertCircle, Loader2, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InputOTP } from "@/components/ui/input-otp";
import { getAuthErrorMessage } from "@/lib/auth-errors";

export function ResetPasswordForm() {
  const { signIn } = useAuthActions();
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const redirect = useMemo(() => searchParams.get("redirect") || "/builder", [searchParams]);
  const isPopup = useMemo(() => searchParams.get("popup") === "1", [searchParams]);

  const [step, setStep] = useState<"request" | { email: string }>("request");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const finishRedirect = () => {
    if (isPopup && typeof window !== "undefined" && window.opener) {
      try {
        const target = new URL(redirect, window.location.origin).toString();
        window.opener.location.href = target;
        window.close();
        return;
      } catch {
        // ignore
      }
    }
    router.push(redirect);
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated) finishRedirect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, isAuthenticated]);

  const requestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await signIn("password", { email, flow: "reset" });
      setStep({ email });
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  const verifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === "request") return;
    setError(null);
    setIsSubmitting(true);
    try {
      await signIn("password", {
        email: step.email,
        code: otp,
        newPassword,
        flow: "reset-verification",
      });
      // If the provider signs the user in, the auth effect will redirect.
      // Otherwise, send them to login.
      setTimeout(() => {
        if (typeof window !== "undefined") {
          const url = `/login?redirect=${encodeURIComponent(redirect)}${isPopup ? "&popup=1" : ""}`;
          window.location.href = url;
        }
      }, 500);
    } catch (err: unknown) {
      setError(getAuthErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold">Reset password</h1>
        <p className="text-sm text-muted-foreground">
          {step === "request" ? "We’ll email you a 6-digit reset code." : "Enter the code and choose a new password."}
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium mb-1">Reset failed</p>
            <p className="text-muted-foreground">{error}</p>
          </div>
        </div>
      )}

      {step === "request" ? (
        <form onSubmit={requestCode} className="space-y-4">
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
                className="w-full h-10 pl-10 pr-4 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <Button type="submit" disabled={isSubmitting || !email} className="w-full">
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : (
              "Send reset code"
            )}
          </Button>
        </form>
      ) : (
        <form onSubmit={verifyAndReset} className="space-y-4">
          <div className="space-y-2 text-center">
            <p className="text-xs text-muted-foreground">
              Code sent to <span className="font-medium">{step.email}</span>
            </p>
          </div>

          <div className="flex justify-center">
            <InputOTP value={otp} onChange={setOtp} />
          </div>

          <div className="space-y-2">
            <label htmlFor="newPassword" className="text-sm font-medium">
              New password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full h-10 pl-10 pr-4 rounded-md border border-input bg-background text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={isSubmitting}
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={isSubmitting || otp.replace(/\D/g, "").length < 6 || newPassword.length < 8}
            className="w-full"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Resetting...
              </>
            ) : (
              "Reset password"
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            className="w-full"
            disabled={isSubmitting}
            onClick={() => {
              setOtp("");
              setNewPassword("");
              setStep("request");
            }}
          >
            Back
          </Button>
        </form>
      )}

      <div className="text-center text-sm">
        <Link
          href={`/login?redirect=${encodeURIComponent(redirect)}${isPopup ? "&popup=1" : ""}`}
          className="text-primary hover:underline font-medium"
        >
          Back to sign in
        </Link>
      </div>
    </div>
  );
}


