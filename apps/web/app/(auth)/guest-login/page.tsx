"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSession } from "next-auth/react";
import { invoke } from "@tauri-apps/api/core";

/**
 * Guest login page - automatically creates a guest account and redirects to home.
 * This page is used when users access the app without logging in.
 */
export default function GuestLoginPage() {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Create guest account and sign in
    const createGuestAndLogin = async () => {
      setIsCreating(true);
      setError(null);

      try {
        // Check if already authenticated (to avoid loops when middleware redirects back)
        const session = await getSession();
        if (session?.user) {
          // Already logged in, go to home
          router.push("/");
          return;
        }

        const response = await fetch("/api/auth/guest", {
          method: "POST",
          credentials: "include",
        });

        if (response.ok) {
          // Sync the freshly minted JWT to ~/.openloomi/token in Tauri mode
          // so the desktop loop can authenticate immediately. Done here
          // (right after the session cookie is set) rather than in the
          // root-level `TokenSync` component because the cookie was set by
          // a direct fetch and `useSession` does not pick up the change
          // automatically.
          const isTauri = !!(window as { __TAURI__?: unknown }).__TAURI__;
          if (isTauri) {
            try {
              const tokenRes = await fetch("/api/auth/token", {
                credentials: "include",
              });
              if (tokenRes.ok) {
                const data = (await tokenRes.json()) as { token?: string };
                if (data.token) {
                  await invoke("save_token", { token: data.token });
                  console.log(
                    "[GuestLogin] token synced to ~/.openloomi/token",
                  );
                }
              }
            } catch (err) {
              console.warn("[GuestLogin] failed to sync token:", err);
            }
          }
          // Successful login, go to home
          router.push("/");
        } else {
          const body = (await response.json().catch(() => null)) as {
            message?: string;
          } | null;
          setError(
            body?.message ??
              "Guest login failed. Check the server database configuration.",
          );
          setIsCreating(false);
        }
      } catch (error) {
        console.error("[GuestLogin] Error:", error);
        setError("Guest login failed. Check the server and try again.");
        setIsCreating(false);
      }
    };

    createGuestAndLogin();
  }, [router, retryCount]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        {error ? (
          <>
            <p className="font-medium mb-2">Unable to start OpenRice</p>
            <p className="text-sm text-muted-foreground max-w-md mb-4">
              {error}
            </p>
            <button
              type="button"
              className="rounded-md bg-primary px-4 py-2 text-primary-foreground"
              disabled={isCreating}
              onClick={() => setRetryCount((count) => count + 1)}
            >
              Try again
            </button>
          </>
        ) : (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4" />
            <p className="text-muted-foreground">Creating guest account...</p>
          </>
        )}
      </div>
    </div>
  );
}
