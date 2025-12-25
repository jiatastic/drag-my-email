"use client";

import Image from "next/image";
import { AuthErrorBoundary } from "@/components/auth/auth-error-boundary";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";

export default function ResetPasswordPage() {
  return (
    <AuthErrorBoundary>
      <div className="grid min-h-svh lg:grid-cols-2">
        <div className="flex flex-col gap-4 p-6 md:p-10">
          <div className="flex justify-center gap-2 md:justify-start">
            <a href="/" className="flex items-center gap-2 font-medium">
              <div className="bg-primary/10 ring-1 ring-primary/15 flex size-8 items-center justify-center rounded-xl">
                <Image src="/logo.svg" alt="Drag.Email" width={18} height={18} priority />
              </div>
              Drag.Email
            </a>
          </div>
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-xs">
              <ResetPasswordForm />
            </div>
          </div>
        </div>
        <div className="bg-muted relative hidden lg:block">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-background" />
          <div className="absolute inset-0 flex items-center justify-center p-10">
            <div className="text-center space-y-4">
              <div className="bg-primary/10 rounded-full p-6 inline-block">
                <Image src="/logo.svg" alt="" width={48} height={48} />
              </div>
              <h2 className="text-2xl font-bold">Get Back In</h2>
              <p className="text-muted-foreground max-w-sm">
                Reset your password and return to the builder in seconds.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AuthErrorBoundary>
  );
}


