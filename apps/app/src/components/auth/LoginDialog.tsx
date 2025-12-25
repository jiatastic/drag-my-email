"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { useConvexAuth } from "convex/react";
import { InputOTP } from "@/components/ui/input-otp";
import {
  Dialog,
  DialogContent,
  Button,
  Input,
  Label,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@react-email-builder/ui";

export interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  /** Initial mode when dialog opens - "signIn" or "signUp" */
  defaultMode?: "signIn" | "signUp";
}

// Product logo reused from /public/logo.svg to match app branding
function AppLogo({ className }: { className?: string }) {
  return (
    <Image
      src="/logo.svg"
      alt="drag.email logo"
      width={48}
      height={48}
      className={className}
      priority
    />
  );
}

export function LoginDialog({ open, onOpenChange, onSuccess, defaultMode = "signIn" }: LoginDialogProps) {
  const { signIn } = useAuthActions();
  const updateName = useMutation(api.users.updateName);
  const { isAuthenticated, isLoading: authLoading } = useConvexAuth();
  const [mode, setMode] = useState<"signIn" | "signUp">(defaultMode);
  const [step, setStep] = useState<"form" | { email: string }>("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Sync mode with defaultMode when dialog opens
  useEffect(() => {
    if (open) {
      setMode(defaultMode);
      setStep("form");
      setOtp("");
    }
  }, [open, defaultMode]);

  useEffect(() => {
    if (!open) return;
    if (!authLoading && isAuthenticated) {
      resetForm();
      onOpenChange(false);
      onSuccess?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, authLoading, isAuthenticated]);

  // Convert technical errors to user-friendly messages
  const getErrorMessage = (error: any): string => {
    const errorMessage = error?.message || error?.toString() || "";
    const errorName = error?.name || "";

    if (errorMessage.includes("InvalidAccountId") || errorName === "InvalidAccountId") {
      return "Account not found. Please sign up first.";
    }
    if (
      errorMessage.includes("InvalidPassword") ||
      errorMessage.includes("invalid password") ||
      errorMessage.includes("InvalidSecret")
    ) {
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

    return mode === "signIn"
      ? "Sign-in failed. Please try again later."
      : "Sign-up failed. Please try again later.";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (mode === "signUp") {
        await signIn("password", { email, password, name, flow: "signUp" });
        const trimmedName = name.trim();
        if (trimmedName) {
          try {
            await updateName({ name: trimmedName });
          } catch (nameError) {
            console.error("Failed to save display name:", nameError);
          }
        }
      } else {
        await signIn("password", { email, password, flow: "signIn" });
      }
      // If email verification is required, show OTP entry.
      const stepEmail = email;
      setTimeout(() => {
        if (!isAuthenticated) {
          setStep({ email: stepEmail });
        }
      }, 150);
    } catch (err: any) {
      console.error("Auth error:", err);
      const friendlyError = getErrorMessage(err);
      setError(friendlyError);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === "form") return;
    setError(null);
    setIsLoading(true);
    try {
      await signIn("password", { email: step.email, code: otp, flow: "email-verification" });
    } catch (err: any) {
      console.error("Email verification error:", err);
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setEmail("");
    setPassword("");
    setName("");
    setOtp("");
    setStep("form");
    setError(null);
  };

  const switchMode = () => {
    resetForm();
    setMode(mode === "signIn" ? "signUp" : "signIn");
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) resetForm();
        onOpenChange(value);
      }}
    >
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        <div className="flex flex-col gap-6">
          <Card className="border-0 shadow-none">
            <CardHeader className="text-center pb-2">
              {/* Logo */}
              <div className="flex justify-center mb-4">
                <AppLogo className="h-12 w-12" />
              </div>
              <CardTitle className="text-xl">
                {mode === "signIn" ? "Login to your account" : "Create an account"}
              </CardTitle>
              <CardDescription>
                {mode === "signIn"
                  ? "Enter your email below to login to your account"
                  : "Enter your details below to create your account"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {step === "form" ? (
              <form onSubmit={handleSubmit}>
                <div className="flex flex-col gap-6">
                  {/* Error message */}
                  {error && (
                    <div className="flex items-start gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                      <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <p>{error}</p>
                    </div>
                  )}

                  {/* Name field (sign up only) */}
                  {mode === "signUp" && (
                    <div className="grid gap-2">
                      <Label htmlFor="dialog-name">Name</Label>
                      <Input
                        id="dialog-name"
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Your name"
                        required={mode === "signUp"}
                        disabled={isLoading}
                      />
                    </div>
                  )}

                  {/* Email field */}
                  <div className="grid gap-2">
                    <Label htmlFor="dialog-email">Email</Label>
                    <Input
                      id="dialog-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="m@example.com"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  {/* Password field */}
                  <div className="grid gap-2">
                    <div className="flex items-center">
                      <Label htmlFor="dialog-password">Password</Label>
                      {mode === "signIn" && (
                        <a
                          href="/reset-password"
                          className="ml-auto inline-block text-sm underline-offset-4 hover:underline text-muted-foreground"
                        >
                          Forgot your password?
                        </a>
                      )}
                    </div>
                    <Input
                      id="dialog-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      disabled={isLoading}
                    />
                  </div>

                  {/* Submit button */}
                  <div className="flex flex-col gap-3">
                    <Button type="submit" disabled={isLoading} className="w-full">
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {mode === "signIn" ? "Signing in..." : "Creating account..."}
                        </>
                      ) : mode === "signIn" ? (
                        "Login"
                      ) : (
                        "Create account"
                      )}
                    </Button>

                    <Button
                      variant="outline"
                      type="button"
                      className="w-full"
                      disabled={isLoading}
                      onClick={() => void signIn("google")}
                    >
                      {mode === "signIn" ? "Login with Google" : "Sign up with Google"}
                    </Button>

                    {/* Switch mode link */}
                    <p className="text-center text-sm text-muted-foreground">
                      {mode === "signIn" ? "Don't have an account? " : "Already have an account? "}
                      <button
                        type="button"
                        onClick={switchMode}
                        className="underline underline-offset-4 hover:text-primary"
                      >
                        {mode === "signIn" ? "Sign up" : "Sign in"}
                      </button>
                    </p>
                  </div>
                </div>
              </form>
              ) : (
                <form onSubmit={handleVerify} className="space-y-4">
                  {error && (
                    <div className="flex items-start gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                      <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                      <p>{error}</p>
                    </div>
                  )}

                  <div className="space-y-2 text-center">
                    <p className="text-sm font-medium">Verify your email</p>
                    <p className="text-xs text-muted-foreground">
                      Enter the 6-digit code sent to <span className="font-medium">{step.email}</span>
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
                    variant="ghost"
                    type="button"
                    className="w-full"
                    disabled={isLoading}
                    onClick={() => {
                      setOtp("");
                      setStep("form");
                    }}
                  >
                    Back
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
