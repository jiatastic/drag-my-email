import { getConvexSiteOriginFromDeploymentUrl } from "@/lib/convexSiteUrl";
import { NextRequest } from "next/server";

async function proxyToConvexAuth(request: NextRequest, targetPath: string) {
  const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!convexUrl) {
    return new Response("Missing NEXT_PUBLIC_CONVEX_URL", { status: 500 });
  }

  const convexSiteOrigin = getConvexSiteOriginFromDeploymentUrl(convexUrl);
  const incomingUrl = new URL(request.url);
  const targetUrl = new URL(targetPath, convexSiteOrigin);
  targetUrl.search = incomingUrl.search;

  // Forward the request to Convex HTTP Actions and return the response verbatim.
  // This preserves redirect Location headers and Set-Cookie headers.
  const headers = new Headers(request.headers);
  headers.delete("content-length");

  const body =
    request.method === "GET" || request.method === "HEAD"
      ? undefined
      : await request.arrayBuffer();

  const res = await fetch(targetUrl, {
    method: request.method,
    headers,
    body,
    redirect: "manual",
  });

  return new Response(res.body, {
    status: res.status,
    headers: res.headers,
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ provider: string }> },
) {
  const { provider } = await params;
  return proxyToConvexAuth(request, `/api/auth/signin/${provider}`);
}


