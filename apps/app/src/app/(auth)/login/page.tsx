"use client";

import Image from "next/image";
import { LoginForm } from "@/components/auth/login-form";
import { AuthErrorBoundary } from "@/components/auth/auth-error-boundary";

export default function LoginPage() {
  return (
    <AuthErrorBoundary>
      <div className="grid min-h-svh lg:grid-cols-2">
        <div className="flex flex-col gap-6 p-6 md:p-10 lg:px-16 lg:py-12">
          <div className="flex justify-center gap-2 md:justify-start">
            <a href="/" className="flex items-center gap-2 font-medium">
              <div className="bg-primary/10 ring-1 ring-primary/15 flex size-8 items-center justify-center rounded-xl">
                <Image src="/logo.svg" alt="Drag.Email" width={18} height={18} priority />
              </div>
              <span className="tracking-tight">Drag.Email</span>
            </a>
          </div>
          <div className="flex flex-1 items-center justify-center">
            <div className="w-full max-w-sm">
              <LoginForm />
            </div>
          </div>
        </div>
        <div className="relative hidden lg:block overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_22%_20%,rgba(30,157,241,0.35),transparent_45%),radial-gradient(circle_at_78%_70%,rgba(224,36,94,0.22),transparent_50%),linear-gradient(135deg,#0a0f1f_0%,#0d1b3d_45%,#060812_100%)]" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-black/35" />
          <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-primary/20 blur-3xl" />
          <div className="absolute -bottom-28 -right-28 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />

          <div className="relative h-full p-12 flex items-end">
            <div className="max-w-md space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs text-white/80 ring-1 ring-white/15 backdrop-blur">
                <span className="inline-flex size-5 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/15">
                  <Image src="/logo.svg" alt="" width={12} height={12} />
                </span>
                Design → Build → Send
              </div>
              <h2 className="text-3xl font-semibold tracking-tight text-white">
                Build stunning emails in minutes.
              </h2>
              <p className="text-sm leading-relaxed text-white/75">
                Drag, drop, and preview responsive templates with components that look great in every inbox.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AuthErrorBoundary>
  );
}
