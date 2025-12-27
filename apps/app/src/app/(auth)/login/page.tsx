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
          <div className="absolute inset-0 bg-[linear-gradient(135deg,#18181b_0%,#27272a_50%,#18181b_100%)]" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-black/20" />
          <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-zinc-600/20 blur-3xl" />
          <div className="absolute -bottom-28 -right-28 h-96 w-96 rounded-full bg-zinc-500/10 blur-3xl" />

          {/* Showcase Images */}
          <div className="absolute inset-0 flex items-center justify-center p-8">
            <div className="relative w-full max-w-lg">
              {/* Main image - front */}
              <div className="relative z-10 rounded-xl overflow-hidden shadow-2xl ring-1 ring-white/10 transform rotate-1 translate-x-4">
                <Image
                  src="https://shiny-fennec-807.convex.cloud/api/storage/bde30790-f97d-4ecd-80eb-6b91bd79b3d2"
                  alt="Email Builder Preview"
                  width={600}
                  height={400}
                  className="w-full h-auto"
                  unoptimized
                />
              </div>
              {/* Secondary image - back */}
              <div className="absolute -bottom-8 -left-8 z-0 rounded-xl overflow-hidden shadow-xl ring-1 ring-white/10 transform -rotate-3 w-3/4">
                <Image
                  src="https://shiny-fennec-807.convex.cloud/api/storage/968a430f-ebee-4d65-8f49-2158e8ad63c5"
                  alt="Email Template Preview"
                  width={450}
                  height={300}
                  className="w-full h-auto"
                  unoptimized
                />
              </div>
            </div>
          </div>

          <div className="relative h-full p-12 flex items-end z-20">
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
