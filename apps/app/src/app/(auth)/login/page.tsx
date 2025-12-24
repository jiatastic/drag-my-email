"use client";

import { GalleryVerticalEnd } from "lucide-react";
import { LoginForm } from "@/components/auth/login-form";
import { AuthErrorBoundary } from "@/components/auth/auth-error-boundary";

export default function LoginPage() {
  return (
    <AuthErrorBoundary>
      <div className="grid min-h-svh lg:grid-cols-2">
        <div className="flex flex-col gap-4 p-6 md:p-10">
          <div className="flex justify-center gap-2 md:justify-start">
            <a href="/" className="flex items-center gap-2 font-medium">
              <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
                <GalleryVerticalEnd className="size-4" />
              </div>
              Email Builder
            </a>
          </div>
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-xs">
              <LoginForm />
            </div>
          </div>
        </div>
        <div className="bg-muted relative hidden lg:block">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-primary/10 to-background" />
          <div className="absolute inset-0 flex items-center justify-center p-10">
            <div className="text-center space-y-4">
              <div className="bg-primary/10 rounded-full p-6 inline-block">
                <GalleryVerticalEnd className="size-12 text-primary" />
              </div>
              <h2 className="text-2xl font-bold">Build Beautiful Emails</h2>
              <p className="text-muted-foreground max-w-sm">
                Create professional email templates with our drag-and-drop builder
              </p>
            </div>
          </div>
        </div>
      </div>
    </AuthErrorBoundary>
  );
}
