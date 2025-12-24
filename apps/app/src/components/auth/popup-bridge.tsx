"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

/**
 * If the app is opened in a popup (from apps/web), this component will
 * redirect the opener to /builder and close the popup.
 *
 * This is especially useful for OAuth flows (Google) where the final redirect
 * lands on /builder inside the popup.
 */
export function PopupBridge() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const popup = searchParams.get("popup") === "1";
    if (!popup) return;
    if (typeof window === "undefined") return;
    if (!window.opener) return;

    try {
      const target = new URL("/builder", window.location.origin).toString();
      window.opener.location.href = target;
      window.close();
    } catch {
      // ignore
    }
  }, [searchParams]);

  return null;
}


