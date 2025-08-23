"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { TL } from "@/lib/terralink";

export default function OAuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState<string>("");
  const [isProcessing, setIsProcessing] = useState(false); // 防止重复处理

  useEffect(() => {
    // 防止重复执行
    if (isProcessing) {
      return;
    }

    const handleCallback = async () => {
      // 设置处理标志，防止重复执行
      setIsProcessing(true);
      
      try {
        const code = searchParams.get("code");
        const state = searchParams.get("state");
        const provider = sessionStorage.getItem("oauth_provider") || "google"; // 从sessionStorage获取provider
        const savedState = sessionStorage.getItem("oauth_state");

        if (!code) {
          throw new Error("Authorization code not found");
        }

        // 验证state参数
        if (savedState && state !== savedState) {
          throw new Error("Invalid state parameter");
        }

        console.log("开始处理OAuth回调:", { provider, code: code.substring(0, 10) + "...", state });

        // 调用后端处理OAuth回调
        const response = await TL.handleOAuthCallback(provider, code, state || undefined);
        console.log("OAuth callback response:", response);
        
        // 设置认证cookie
        const cookieResponse = await fetch("/api/auth/oauth/callback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: response.access_token })
        });
        
        if (!cookieResponse.ok) {
          throw new Error(`Failed to set authentication cookie: ${cookieResponse.status}`);
        }
        
        console.log("Cookie set successfully");

        // 清理sessionStorage中的临时数据
        sessionStorage.removeItem("oauth_provider");
        sessionStorage.removeItem("oauth_state");
        
        setStatus("success");
        
        // 延迟跳转到控制台
        setTimeout(() => {
          router.push("/app");
        }, 2000);
        
      } catch (err) {
        console.error("OAuth callback error:", err);
        setError(err instanceof Error ? err.message : "OAuth认证失败");
        setStatus("error");
      }
    };

    handleCallback();
  }, []); // 移除依赖项，只在组件挂载时执行一次

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Terralink</h1>
          <p className="text-gray-600">正在处理OAuth认证...</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8">
          {status === "loading" && (
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-gray-600">正在验证您的身份...</p>
            </div>
          )}

          {status === "success" && (
            <div className="text-center">
              <div className="text-green-500 text-6xl mb-4">✓</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">认证成功！</h2>
              <p className="text-gray-600">正在跳转到控制台...</p>
            </div>
          )}

          {status === "error" && (
            <div className="text-center">
              <div className="text-red-500 text-6xl mb-4">✗</div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">认证失败</h2>
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={() => router.push("/")}
                className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
              >
                返回首页
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}