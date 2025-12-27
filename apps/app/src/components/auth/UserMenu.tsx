"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useConvexAuth } from "convex/react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { LogOut, Settings, Loader2, Sparkles } from "lucide-react";
import { useState, useRef, useEffect, useMemo } from "react";
import { LoginDialog } from "./LoginDialog";
import { AccountSettingsDialog } from "./AccountSettingsDialog";

export function UserMenu() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const { signOut } = useAuthActions();
  const user = useQuery(api.users.current);
  const rateLimits = useQuery(api.rateLimits.getAll);
  const userSettings = useQuery(api.userSettings.get);
  const [isOpen, setIsOpen] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [loginMode, setLoginMode] = useState<"signIn" | "signUp">("signIn");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const plan = userSettings?.plan || "free";
  
  // Calculate total usage percentage for quick summary
  const usageSummary = useMemo(() => {
    if (!rateLimits) return null;
    const aiLimit = rateLimits.ai_assistant;
    if (!aiLimit) return null;
    return {
      used: aiLimit.count,
      limit: aiLimit.limit,
      percentage: aiLimit.limit > 0 ? Math.round((aiLimit.count / aiLimit.limit) * 100) : 0,
    };
  }, [rateLimits]);

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
      <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setLoginMode("signIn");
              setLoginDialogOpen(true);
            }}
          className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Sign in
          </button>
          <button
            onClick={() => {
              setLoginMode("signUp");
              setLoginDialogOpen(true);
            }}
          className="px-3 py-1.5 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          Sign up
          </button>
      </div>
        <LoginDialog 
          open={loginDialogOpen} 
          onOpenChange={setLoginDialogOpen}
          defaultMode={loginMode}
        />
      </>
    );
  }

  const userEmail = user?.email || "User";
  const firstName = (user as any)?.firstName as string | undefined;
  const lastName = (user as any)?.lastName as string | undefined;
  const profileName = `${firstName ?? ""} ${lastName ?? ""}`.trim();
  const userName = profileName || user?.name || userEmail.split("@")[0];
  const initials = userName.slice(0, 2).toUpperCase();

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-muted transition-colors"
      >
        <div className="h-8 w-8 rounded-full bg-muted text-foreground ring-1 ring-border overflow-hidden flex items-center justify-center text-xs font-medium">
          {user?.image ? (
            <img src={user.image} alt="Avatar" className="h-full w-full object-cover" />
          ) : (
            initials
          )}
        </div>
        <span className="text-sm font-medium text-foreground hidden sm:block">
          {userName}
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-64 bg-background border border-border rounded-lg py-1 z-50">
          <div className="px-3 py-2 border-b border-border">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-foreground">{userName}</p>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                plan === "pro" 
                  ? "bg-primary/10 text-primary" 
                  : "bg-muted text-muted-foreground"
              }`}>
                {plan === "pro" ? "Pro" : "Free"}
              </span>
            </div>
            <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
          </div>

          {/* Quick Usage Summary */}
          {usageSummary && (
            <div className="px-3 py-2 border-b border-border">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Sparkles className="h-3 w-3" />
                  <span>AI Usage Today</span>
                </div>
                <span className="text-xs font-medium">
                  {usageSummary.used}/{usageSummary.limit}
                </span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 rounded-full ${
                    usageSummary.percentage >= 100 ? "bg-destructive" : 
                    usageSummary.percentage >= 80 ? "bg-yellow-500" : "bg-primary"
                  }`}
                  style={{ width: `${Math.min(usageSummary.percentage, 100)}%` }}
                />
              </div>
            </div>
          )}

          <div className="py-1">
            <button
              onClick={() => {
                setIsOpen(false);
                setSettingsOpen(true);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted transition-colors"
            >
              <Settings className="h-4 w-4" />
              Settings & Usage
            </button>
          </div>

          <div className="border-t border-border py-1">
            <button
              onClick={async () => {
                setIsOpen(false);
                await signOut();
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </button>
          </div>
        </div>
      )}

      <AccountSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
