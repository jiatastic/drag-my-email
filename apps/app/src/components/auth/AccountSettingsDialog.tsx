"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import type { Id } from "../../../convex/_generated/dataModel";
import { api } from "../../../convex/_generated/api";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from "@react-email-builder/ui";
import { Loader2, Zap, Sparkles, Mail, Image } from "lucide-react";

// Usage limit display labels
const USAGE_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  brand_import: { label: "Brand Imports", icon: <Zap className="h-4 w-4" /> },
  asset_generate: { label: "AI Image Generation", icon: <Image className="h-4 w-4" /> },
  ai_assistant: { label: "AI Email Assistant", icon: <Sparkles className="h-4 w-4" /> },
  email_send: { label: "Emails Sent", icon: <Mail className="h-4 w-4" /> },
};

function UsageBar({ used, limit }: { used: number; limit: number }) {
  const percentage = limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;
  
  return (
    <div className="space-y-1">
      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full transition-all duration-300 rounded-full ${
            isAtLimit ? "bg-destructive" : isNearLimit ? "bg-yellow-500" : "bg-primary"
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{used} used</span>
        <span>{limit - used} remaining</span>
      </div>
    </div>
  );
}

function formatResetTime(resetAt: number): string {
  const now = Date.now();
  const diff = resetAt - now;
  if (diff <= 0) return "Resetting...";
  
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `Resets in ${hours}h ${minutes}m`;
  }
  return `Resets in ${minutes}m`;
}

export type AccountSettingsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function splitName(fullName: string): { firstName: string; lastName: string } {
  const trimmed = (fullName ?? "").trim();
  if (!trimmed) return { firstName: "", lastName: "" };
  const parts = trimmed.split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0]!, lastName: "" };
  return { firstName: parts[0]!, lastName: parts.slice(1).join(" ") };
}

export function AccountSettingsDialog({ open, onOpenChange }: AccountSettingsDialogProps) {
  const user = useQuery(api.users.current);
  const updateProfile = useMutation(api.users.updateProfile);
  const generateAvatarUploadUrl = useMutation(api.users.generateAvatarUploadUrl);
  const userSettings = useQuery(api.userSettings.get);
  const rateLimits = useQuery(api.rateLimits.getAll);
  
  const plan = userSettings?.plan || "free";

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);
  const avatarPreviewUrlRef = useRef<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const derivedFromName = useMemo(() => splitName(user?.name ?? ""), [user?.name]);
  const initialFirstName = (user as any)?.firstName ?? derivedFromName.firstName;
  const initialLastName = (user as any)?.lastName ?? derivedFromName.lastName;

  useEffect(() => {
    if (!open) return;
    setError(null);
    setFirstName(initialFirstName ?? "");
    setLastName(initialLastName ?? "");
    setAvatarFile(null);
    setAvatarPreviewUrl(null);
  }, [open, initialFirstName, initialLastName]);

  useEffect(() => {
    return () => {
      if (avatarPreviewUrlRef.current) URL.revokeObjectURL(avatarPreviewUrlRef.current);
      avatarPreviewUrlRef.current = null;
    };
  }, []);

  async function uploadAvatar(file: File): Promise<Id<"_storage">> {
    const uploadUrl = await generateAvatarUploadUrl({});
    const res = await fetch(uploadUrl, {
      method: "POST",
      headers: { "Content-Type": file.type || "application/octet-stream" },
      body: file,
    });
    if (!res.ok) {
      throw new Error("Avatar upload failed");
    }
    const json = (await res.json()) as { storageId?: string };
    if (!json.storageId) {
      throw new Error("Avatar upload did not return a storageId");
    }
    return json.storageId as Id<"_storage">;
  }

  async function onSave() {
    setError(null);
    setSaving(true);
    try {
      let avatarStorageId: Id<"_storage"> | undefined;
      if (avatarFile) {
        avatarStorageId = await uploadAvatar(avatarFile);
      }

      await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        ...(avatarStorageId ? { avatarStorageId } : {}),
      });

      onOpenChange(false);
    } catch (e: any) {
      setError(e?.message || "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  const currentAvatarUrl = avatarPreviewUrl || user?.image || null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Account settings</DialogTitle>
          <DialogDescription>Update your profile and view your usage limits.</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-full bg-muted ring-1 ring-border overflow-hidden flex items-center justify-center text-sm font-medium flex-shrink-0">
              {currentAvatarUrl ? (
                // Use <img> (not next/image) to avoid requiring next.config remotePatterns.
                <img src={currentAvatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                <span>{(user?.name || user?.email || "U").slice(0, 2).toUpperCase()}</span>
              )}
            </div>
            <div className="flex-1 space-y-2">
              <Label htmlFor="avatar">Avatar</Label>
              <div className="relative">
                <Input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  disabled={saving}
                  className="sr-only"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    setAvatarFile(file);

                    if (avatarPreviewUrlRef.current) URL.revokeObjectURL(avatarPreviewUrlRef.current);
                    avatarPreviewUrlRef.current = null;

                    if (file) {
                      const url = URL.createObjectURL(file);
                      avatarPreviewUrlRef.current = url;
                      setAvatarPreviewUrl(url);
                    } else {
                      setAvatarPreviewUrl(null);
                    }
                  }}
                />
                <label
                  htmlFor="avatar"
                  className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 cursor-pointer"
                >
                  {avatarFile ? avatarFile.name : "Choose File"}
                </label>
              </div>
            </div>
          </div>

          {/* Name Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First name</Label>
              <Input
                id="firstName"
                value={firstName}
                disabled={saving}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input
                id="lastName"
                value={lastName}
                disabled={saving}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last name"
              />
            </div>
          </div>

          {/* Usage Limits Section */}
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">Daily Usage</Label>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                plan === "pro" 
                  ? "bg-primary/10 text-primary" 
                  : "bg-muted text-muted-foreground"
              }`}>
                {plan === "pro" ? "Pro Plan" : "Free Plan"}
              </span>
            </div>
            
            {rateLimits ? (
              <div className="space-y-4">
                {Object.entries(rateLimits).map(([action, data]) => {
                  const config = USAGE_LABELS[action];
                  if (!config) return null;
                  
                  return (
                    <div key={action} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          {config.icon}
                          <span>{config.label}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatResetTime(data.resetAt)}
                        </span>
                      </div>
                      <UsageBar used={data.count} limit={data.limit} />
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">Loading usage data...</div>
            )}
            
            {plan === "free" && (
              <div className="text-xs text-muted-foreground mt-2 p-3 bg-muted/50 rounded-lg">
                <span className="font-medium">Need more?</span> Upgrade to Pro for higher limits and unlimited AI assistance.
              </div>
            )}
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </div>
          )}
        </div>

        <DialogFooter className="mt-6 gap-2 sm:space-x-0 sm:gap-2">
          <Button variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={saving} onClick={() => void onSave()}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


