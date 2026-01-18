"use client";

import { useEffect, useState, type MouseEvent } from "react";

const APP_URL = "https://app.drag.email";
const GITHUB_URL = "https://github.com/jiatastic/drag-my-email";
const BLOG_URL = "https://drag.email/blog";
const CHANGELOG_URL = "https://drag.email/changelog";
const INSTALL_COMMAND = `# Install deps
bun install

# App env (builder)
cp apps/app/env.example apps/app/.env.local

# Start builder
bun dev:app`;

export default function Home() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [ripple, setRipple] = useState<{ x: number; y: number; color: string; key: number } | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    setTheme(prefersDark ? "dark" : "light");
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const getThemeBackground = (nextTheme: "dark" | "light") => {
    const root = document.documentElement;
    const wasDark = root.classList.contains("dark");
    root.classList.toggle("dark", nextTheme === "dark");
    const value = getComputedStyle(root).getPropertyValue("--background").trim();
    root.classList.toggle("dark", wasDark);
    return value || "oklch(0.98 0 0)";
  };

  const handleThemeToggle = (event: MouseEvent<HTMLButtonElement>) => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    const nextBg = getThemeBackground(nextTheme);
    setRipple({ x: event.clientX, y: event.clientY, color: nextBg, key: Date.now() });
    setTheme(nextTheme);
    window.setTimeout(() => setRipple(null), 450);
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-24 text-center">
        {ripple ? (
          <span
            key={ripple.key}
            aria-hidden="true"
            className="theme-ripple"
            style={{ left: ripple.x, top: ripple.y, backgroundColor: ripple.color }}
          />
        ) : null}
        <button
          type="button"
          onClick={handleThemeToggle}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          className="absolute right-6 top-6 flex h-10 w-10 items-center justify-center rounded-full border border-border text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          {theme === "dark" ? (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M12 3v2" />
              <path d="M12 19v2" />
              <path d="M4.22 4.22l1.42 1.42" />
              <path d="M18.36 18.36l1.42 1.42" />
              <path d="M3 12h2" />
              <path d="M19 12h2" />
              <path d="M4.22 19.78l1.42-1.42" />
              <path d="M18.36 5.64l1.42-1.42" />
              <circle cx="12" cy="12" r="4" />
            </svg>
          ) : (
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-5 w-5"
              aria-hidden="true"
            >
              <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
            </svg>
          )}
        </button>
        <div className="flex flex-col items-center gap-5">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-border bg-card">
            <img src="/icon.svg" alt="Drag.email" className="h-7 w-7" />
          </div>

          <div className="max-w-3xl space-y-3">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
              Drag is an AI-native email builder for your SaaS.
            </h1>
            <p className="text-sm text-muted-foreground sm:text-base">
              Build emails with an AI-native, drag-and-drop editor. Export React Email code or HTML, and
              self-host for full control.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <a
              href={APP_URL}
              className="rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:opacity-90"
            >
              Try it free
              <span className="ml-2 text-xs font-semibold text-primary-foreground/70">
                (completely free)
              </span>
            </a>
            <a
              href={GITHUB_URL}
              className="flex items-center gap-2 rounded-full border border-border px-5 py-2 text-sm font-semibold text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
            >
              <img
                src="https://www.google.com/s2/favicons?domain=github.com&sz=64"
                alt=""
                className="h-4 w-4 rounded-sm"
                aria-hidden="true"
              />
              Star on GitHub
            </a>
          </div>

          
        </div>

        <div className="mt-10 w-full max-w-2xl rounded-2xl border border-border bg-card p-4 text-left">
          <div className="text-xs font-medium text-muted-foreground">Self-hosted setup</div>

          <pre className="mt-4 rounded-xl border border-border bg-muted px-4 py-3 font-mono text-sm text-foreground whitespace-pre-wrap">
            {INSTALL_COMMAND}
          </pre>
        </div>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-xs">
          <a href={`${APP_URL}/demo`} className="text-muted-foreground transition-colors hover:text-foreground">
            restart demo
          </a>
          <span className="text-border">·</span>
          <a href="https://x.com/jiatastic520" className="text-muted-foreground transition-colors hover:text-foreground">
            follow me on X
          </a>
          <span className="text-border">·</span>
          <a href="https://www.linkedin.com/in/haoxiang-jia/" className="text-muted-foreground transition-colors hover:text-foreground">
            linkedin
          </a>
        </div>
      </div>
    </main>
  );
}
