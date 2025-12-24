"use client";

import { Component, ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import Link from "next/link";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AuthErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Auth Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || "";
      const isInvalidAccountId = errorMessage.includes("InvalidAccountId");

      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="max-w-md w-full space-y-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <h1 className="text-lg font-semibold">An error occurred</h1>
            </div>
            
            <div className="p-4 bg-muted rounded-lg space-y-2">
              {isInvalidAccountId ? (
                <>
                  <p className="text-sm text-foreground">
                    Invalid account information. This usually happens when:
                  </p>
                  <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                    <li>Attempting to sign in to a non-existent account</li>
                    <li>Account data is corrupted or missing</li>
                  </ul>
                  <p className="text-sm text-foreground mt-3">
                    <strong>Solution:</strong> Please sign up for a new account, or contact support.
                  </p>
                </>
              ) : (
                <p className="text-sm text-foreground">
                  {errorMessage || "An unknown error occurred. Please refresh the page and try again."}
                </p>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.reload();
                }}
                className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                Refresh page
              </button>
              <Link
                href="/signup"
                className="flex-1 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors text-center"
              >
                Sign up
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
