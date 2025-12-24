import type { Metadata } from "next";
import Script from "next/script";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "React Email Builder",
  description: "Drag and drop email builder with React Email components",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ConvexAuthNextjsServerProvider>
      <html lang="en" suppressHydrationWarning>
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <Script id="theme-init" strategy="beforeInteractive">
            {`(() => {
  try {
    const key = "reb-theme";
    const stored = window.localStorage.getItem(key);
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    const useDark = stored === "dark" || (!stored || stored === "system") && prefersDark;
    document.documentElement.classList.toggle("dark", !!useDark);
  } catch {}
})();`}
          </Script>
          {process.env.NODE_ENV === "development" && (
            <Script
              src="//unpkg.com/react-grab/dist/index.global.js"
              crossOrigin="anonymous"
              strategy="beforeInteractive"
            />
          )}
          {/* rest of your scripts go under */}
        </head>
        <body className="min-h-screen bg-background font-sans antialiased">
          <ConvexClientProvider>
            <ThemeProvider>{children}</ThemeProvider>
          </ConvexClientProvider>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}

