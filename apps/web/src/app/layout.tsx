import type { Metadata } from "next";
import Script from "next/script";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "drag.email - drag & drop email like lego blocks",
  description: "Build beautiful, responsive emails with a visual drag-and-drop editor. Export clean React Email code instantly. No design skills required.",
  keywords: ["email builder", "react email", "drag and drop", "email templates", "responsive emails", "email design"],
  openGraph: {
    title: "drag.email - drag & drop email like lego blocks",
    description: "Build beautiful, responsive emails with a visual drag-and-drop editor. Export clean React Email code & html instantly.",
    type: "website",
    url: "https://drag.email",
  },
  twitter: {
    card: "summary_large_image",
    title: "drag.email - drag & drop email like lego blocks",
      description: "Build beautiful, responsive emails with a visual drag-and-drop editor. Export clean React Email code & html instantly.",
    },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {process.env.NODE_ENV === "development" && (
          <Script
            src="//unpkg.com/react-grab/dist/index.global.js"
            crossOrigin="anonymous"
            strategy="beforeInteractive"
          />
        )}
      </head>
      <body className="bg-background text-foreground font-sans antialiased min-h-screen">
        {children}
        <Script
          defer
          data-website-id="dfid_m8dwHWeP5mvM2qdE7U8RQ"
          data-domain="drag.email"
          src="https://datafa.st/js/script.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
