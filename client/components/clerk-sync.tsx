"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@clerk/nextjs";

export function ClerkSync() {
  const { isSignedIn, getToken, userId } = useAuth();
  const syncInProgress = useRef<string | null>(null);

  useEffect(() => {
    if (!isSignedIn || !userId) {
      return;
    }

    // Prevent duplicate/concurrent sync calls for the same user session
    if (syncInProgress.current === userId) {
      return;
    }

    const syncUserWithBackend = async () => {
      syncInProgress.current = userId;
      try {
        const token = await getToken();
        if (!token) {
          console.warn("[ClerkSync] No authentication token retrieved from Clerk.");
          return;
        }

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";
        console.log(`[ClerkSync] Syncing user ${userId} with backend at ${apiUrl}...`);

        const response = await fetch(`${apiUrl}/auth/sync`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("[ClerkSync] Successfully synced user with backend:", data);
      } catch (error) {
        console.error("[ClerkSync] Failed to sync user with backend:", error);
        // Reset the ref on error to allow for retry if triggered again
        syncInProgress.current = null;
      }
    };

    syncUserWithBackend();
  }, [isSignedIn, userId, getToken]);

  return null;
}
