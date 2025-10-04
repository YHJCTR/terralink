"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TL } from "@/lib/terralink";

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (isProcessing) return;

    const handleCallback = async () => {
      setIsProcessing(true);

      try {
        const code = searchParams.get("code");
        const state = searchParams.get("state");
        const provider = sessionStorage.getItem("oauth_provider") || "google";
        const savedState = sessionStorage.getItem("oauth_state");

        if (!code) {
          throw new Error("Authorization code not found");
        }

        if (savedState && state !== savedState) {
          throw new Error("Invalid state parameter");
        }

        const response = await TL.handleOAuthCallback(provider, code, state || undefined);

        const cookieResponse = await fetch("/api/auth/oauth/callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: response.access_token })
        });

        if (!cookieResponse.ok) {
          throw new Error(`Failed to set authentication cookie: ${cookieResponse.status}`);
        }

        sessionStorage.removeItem("oauth_provider");
        sessionStorage.removeItem("oauth_state");

        // Redirect immediately to the console; keep spinner visible until navigation
        router.push("/app");
      } catch (err) {
        // On error, just go back to home; keep spinner only
        router.replace("/");
      }
    };

    handleCallback();
  }, [isProcessing, router, searchParams]);

  // Minimal waiting animation only (no success/error page UI)
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
    </div>
  );
}