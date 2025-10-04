"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TL } from "@/lib/terralink";

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false); // Prevent duplicate processing

  useEffect(() => {
    // Prevent duplicate execution
    if (isProcessing) {
      return;
    }

    const handleCallback = async () => {
      // Set processing flag to prevent duplicate execution
      setIsProcessing(true);
      
      try {
        const code = searchParams.get("code");
        const state = searchParams.get("state");
        const provider = sessionStorage.getItem("oauth_provider") || "google"; // Get provider from sessionStorage
        const savedState = sessionStorage.getItem("oauth_state");

        if (!code) {
          throw new Error("Authorization code not found");
        }

        // Validate state parameter
        if (savedState && state !== savedState) {
          throw new Error("Invalid state parameter");
        }

        console.log("Starting OAuth callback processing:", { provider, code: code.substring(0, 10) + "...", state });

        // Call backend to handle OAuth callback
        const response = await TL.handleOAuthCallback(provider, code, state || undefined);
        console.log("OAuth callback response:", response);
        
        setStatus("success");
        
        // Send success message to parent window
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({
            type: 'OAUTH_SUCCESS',
            token: response.access_token
          }, window.location.origin);
        } else {
          // Fallback: set cookie and redirect if not in iframe
          const cookieResponse = await fetch("/api/auth/oauth/callback", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token: response.access_token })
          });

          if (!cookieResponse.ok) {
            throw new Error(`Failed to set authentication cookie: ${cookieResponse.status}`);
          }
          
          console.log("Cookie set successfully");
          
          // Clean up temporary data
          sessionStorage.removeItem("oauth_provider");
          sessionStorage.removeItem("oauth_state");
          
          // Redirect to console after a brief delay
          setTimeout(() => {
            router.push("/app");
          }, 1000);
        }
        
      } catch (err) {
        console.error("OAuth callback error:", err);
        const errorMessage = err instanceof Error ? err.message : "OAuth authentication failed";
        setError(errorMessage);
        setStatus("error");
        
        // Send error message to parent window
        if (window.parent && window.parent !== window) {
          window.parent.postMessage({
            type: 'OAUTH_ERROR',
            error: errorMessage
          }, window.location.origin);
        }
        

      }
    };

    handleCallback();
  }, []); // Remove dependencies, execute only once when component mounts

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Terralink</h1>
          <p className="text-gray-600">Processing OAuth authentication...</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          {status === "loading" && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">Verifying your identity...</p>
            </div>
          )}

          {status === "success" && (
            <div className="text-center">
              <div className="text-green-500 text-6xl mb-4">✓</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Successful!</h2>
              <p className="text-gray-600">Redirecting to console...</p>
            </div>
          )}

          {status === "error" && (
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">✗</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Authentication Failed</h2>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={() => router.push("/")}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                Back to Home
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}