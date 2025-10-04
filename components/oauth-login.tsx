"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { TL } from "@/lib/terralink";

interface OAuthProvider {
  id: number;
  name: string;
  display_name: string;
  client_id: string;
  is_active: boolean;
}

interface OAuthLoginProps {
  onError: (error: string) => void;
}

export default function OAuthLogin({ onError }: OAuthLoginProps) {
  const [providers, setProviders] = useState<OAuthProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const data = await TL.getOAuthProviders();
        setProviders(data.filter(p => p.is_active));
      } catch (error) {
        console.error("Failed to fetch OAuth providers:", error);
        onError("Unable to load OAuth providers");
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, [onError]);

  const handleOAuthLogin = async (provider: string) => {
    setAuthLoading(provider);
    
    try {
      const redirectUri = `${window.location.origin}/auth/callback`;
      const response = await TL.initiateOAuth(provider, redirectUri);
      
      // Save provider information to sessionStorage for callback page use
      sessionStorage.setItem('oauth_provider', provider);
      sessionStorage.setItem('oauth_state', response.state);
      
      // Create hidden iframe for OAuth authentication
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.src = response.auth_url;
      document.body.appendChild(iframe);

      // Listen for messages from the iframe
      const handleMessage = async (event: MessageEvent) => {
        if (event.origin !== window.location.origin) {
          return;
        }

        if (event.data.type === 'OAUTH_SUCCESS') {
          window.removeEventListener('message', handleMessage);
          document.body.removeChild(iframe);
          
          try {
            // Set authentication cookie
            const cookieResponse = await fetch("/api/auth/oauth/callback", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ token: event.data.token })
            });
            
            if (!cookieResponse.ok) {
              throw new Error(`Failed to set authentication cookie: ${cookieResponse.status}`);
            }
            
            // Clean up temporary data
            sessionStorage.removeItem("oauth_provider");
            sessionStorage.removeItem("oauth_state");
            
            // Redirect to console
            router.push("/app");
          } catch (error) {
            console.error("Failed to complete authentication:", error);
            onError(error instanceof Error ? error.message : "Authentication failed");
          } finally {
            setAuthLoading(null);
          }
        } else if (event.data.type === 'OAUTH_ERROR') {
          window.removeEventListener('message', handleMessage);
          document.body.removeChild(iframe);
          setAuthLoading(null);
          onError(event.data.error || "OAuth authentication failed");
        }
      };

      window.addEventListener('message', handleMessage);

      // Set a timeout to handle cases where the iframe doesn't respond
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          window.removeEventListener('message', handleMessage);
          document.body.removeChild(iframe);
          setAuthLoading(null);
          onError("Authentication timeout. Please try again.");
        }
      }, 60000); // 60 second timeout

    } catch (error) {
      console.error("OAuth login error:", error);
      onError(error instanceof Error ? error.message : "OAuth login failed");
      setAuthLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
        <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
      </div>
    );
  }

  if (providers.length === 0) {
    return null;
  }

  const getProviderIcon = (providerName: string) => {
    switch (providerName.toLowerCase()) {
      case "google":
        return (
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        );
      case "github":
        return (
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
          </svg>
        );
      default:
        return (
          <div className="w-5 h-5 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
            {providerName.charAt(0).toUpperCase()}
          </div>
        );
    }
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300" />
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="px-2 bg-white text-gray-500">Or continue with</span>
        </div>
      </div>

      {providers.map((provider) => (
        <button
          key={provider.id}
          onClick={() => handleOAuthLogin(provider.name)}
          disabled={authLoading !== null}
          className={`w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
            authLoading === provider.name
              ? 'bg-blue-50 text-blue-700 border-blue-300'
              : authLoading !== null
              ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
              : 'bg-white text-gray-700 hover:bg-gray-50'
          }`}
        >
          {authLoading === provider.name ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="ml-2">Connecting to {provider.display_name}...</span>
            </>
          ) : (
            <>
              {getProviderIcon(provider.name)}
              <span className="ml-2">Sign in with {provider.display_name}</span>
            </>
          )}
        </button>
      ))}
    </div>
  );
}