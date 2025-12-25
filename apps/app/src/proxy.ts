import type { NextRequest, NextFetchEvent } from "next/server";
import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";

// Public routes that don't require authentication
const isPublicRoute = createRouteMatcher(["/", "/login", "/signup", "/reset-password"]);

// Create the Convex Auth middleware
const middleware = convexAuthNextjsMiddleware(
  async (request, { convexAuth }) => {
    // Redirect authenticated users away from auth pages
    if (
      (request.nextUrl.pathname === "/login" ||
        request.nextUrl.pathname === "/signup") &&
      (await convexAuth.isAuthenticated())
    ) {
      return nextjsMiddlewareRedirect(request, "/builder");
    }

    // Redirect unauthenticated users from protected routes
    if (!isPublicRoute(request) && !(await convexAuth.isAuthenticated())) {
      return nextjsMiddlewareRedirect(request, "/login");
    }
  },
);

// Next.js 16 uses `proxy` instead of default export `middleware`
// Type assertion needed because @convex-dev/auth hasn't updated types for Next.js 16 yet
export function proxy(request: NextRequest, event: NextFetchEvent) {
  return middleware(request as any, event as any);
}

export const config = {
  // Run proxy on all routes except static assets
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};

