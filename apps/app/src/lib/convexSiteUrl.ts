/**
 * Derive the Convex "site" origin (HTTP Actions origin) from a Convex deployment URL.
 *
 * - `https://my-deployment.convex.cloud` -> `https://my-deployment.convex.site`
 * - `https://my-deployment.convex.site`  -> `https://my-deployment.convex.site`
 *
 * This is used for proxying Convex Auth HTTP routes (`/api/auth/...`) through Next.js,
 * which is helpful when `CUSTOM_AUTH_SITE_URL` points at the Next.js app origin.
 */
export function getConvexSiteOriginFromDeploymentUrl(convexUrl: string): string {
  const url = new URL(convexUrl);

  if (url.hostname.endsWith(".convex.cloud")) {
    url.hostname = url.hostname.replace(/\.convex\.cloud$/, ".convex.site");
  }

  // Keep protocol/port/path consistent; we only need the origin.
  return url.origin;
}


