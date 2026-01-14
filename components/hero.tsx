"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import OAuthLogin from "./oauth-login";

export default function Hero() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [cooldownUntilMs, setCooldownUntilMs] = useState<number | null>(null);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const router = useRouter();

  // Mouse tracking for interactive effects
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useEffect(() => {
    if (!cooldownUntilMs) return;
    const tick = () => {
      const remainingMs = cooldownUntilMs - Date.now();
      const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));
      setCooldownSeconds(remainingSeconds);
      if (remainingSeconds === 0) setCooldownUntilMs(null);
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [cooldownUntilMs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    if (cooldownUntilMs && Date.now() < cooldownUntilMs) return;
    setLoading(true);
    setError("");

    try {
      if (isLogin) {
        // Call BFF login API
        const response = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email, password })
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData?.detail || errorData?.message || "Login failed");
        }
        
        // Login successful, BFF has set httpOnly cookie
        router.push("/app");
      } else {
        // Call BFF register API
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }) // Remove user_id
        });
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          if (response.status === 429) {
            const retryAfterHeader = response.headers.get("retry-after");
            const retryAfterSeconds = retryAfterHeader ? Number(retryAfterHeader) : NaN;
            const seconds = Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0 ? retryAfterSeconds : 10;
            setCooldownUntilMs(Date.now() + seconds * 1000);
            throw new Error(`请求太频繁（429），请 ${seconds}s 后再试`);
          }
          throw new Error(errorData?.detail || errorData?.message || "Registration failed");
        }
        
        setIsLogin(true);
        setError("Registration successful! Please login.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-zinc-900 via-gray-900 to-black">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
        
        {/* Floating particles */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-blue-400 rounded-full opacity-30 animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 3}s`
              }}
            ></div>
          ))}
        </div>

        {/* Interactive glow effect */}
        <div 
          className="absolute w-96 h-96 bg-blue-500/10 rounded-full blur-3xl transition-all duration-300"
          style={{
            left: mousePosition.x - 192,
            top: mousePosition.y - 192,
          }}
        ></div>
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
        <div className="max-w-6xl w-full grid lg:grid-cols-2 gap-12 items-center">
          {/* Left side - Hero content */}
          <div className="text-center lg:text-left space-y-8">
            <div className="space-y-4">
              <div className="inline-flex items-center px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-300 text-sm font-medium backdrop-blur-sm">
                🛰️ Earth Observation Platform
              </div>
              <h1 className="text-5xl lg:text-7xl font-bold bg-gradient-to-r from-white via-blue-100 to-cyan-200 bg-clip-text text-transparent leading-tight">
                Terralink
              </h1>
              <p className="text-xl lg:text-2xl text-gray-300 max-w-2xl">
                Advanced Earth observation agents powered by AI. Monitor, analyze, and understand our planet like never before.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
              <div className="p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl">
                <div className="text-2xl font-bold text-blue-400">24/7</div>
                <div className="text-sm text-gray-400">Monitoring</div>
              </div>
              <div className="p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl">
                <div className="text-2xl font-bold text-green-400">AI-Powered</div>
                <div className="text-sm text-gray-400">Analysis</div>
              </div>
              <div className="p-4 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl">
                <div className="text-2xl font-bold text-cyan-400">Real-time</div>
                <div className="text-sm text-gray-400">Insights</div>
              </div>
            </div>
          </div>

          {/* Right side - Login form */}
          <div className="max-w-md w-full mx-auto">
            <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-8 shadow-2xl">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-white mb-2">Access Mission Control</h2>
                <p className="text-gray-300">Connect to your Earth observation dashboard</p>
              </div>

              <div className="flex mb-6 bg-white/5 rounded-lg p-1">
                <button
                  onClick={() => setIsLogin(true)}
                  className={`flex-1 py-3 px-4 text-center font-medium rounded-md transition-all ${
                    isLogin
                      ? "bg-blue-500 text-white shadow-lg"
                      : "text-gray-300 hover:text-white hover:bg-white/10"
                  }`}
                >
                  Login
                </button>
                <button
                  onClick={() => setIsLogin(false)}
                  className={`flex-1 py-3 px-4 text-center font-medium rounded-md transition-all ${
                    !isLogin
                      ? "bg-blue-500 text-white shadow-lg"
                      : "text-gray-300 hover:text-white hover:bg-white/10"
                  }`}
                >
                  Register
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white placeholder-gray-400 backdrop-blur-sm"
                    placeholder="agent@terralink.com"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-200 mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent text-white placeholder-gray-400 backdrop-blur-sm"
                    placeholder="••••••••"
                    required
                  />
                </div>

                {error && (
                  <div className={`text-sm p-4 rounded-lg backdrop-blur-sm ${
                    error.includes("successful") 
                      ? "bg-green-500/20 border border-green-500/30 text-green-300" 
                      : "bg-red-500/20 border border-red-500/30 text-red-300"
                  }`}>
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || cooldownSeconds > 0}
                  className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 text-white py-3 px-6 rounded-lg hover:from-blue-600 hover:to-cyan-700 focus:outline-none focus:ring-2 focus:ring-blue-400 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></div>
                      Connecting...
                    </div>
                  ) : cooldownSeconds > 0 ? (
                    `请稍候 ${cooldownSeconds}s`
                  ) : (
                    isLogin ? "Access Dashboard" : "Join Mission"
                  )}
                </button>
              </form>

              {/* OAuth login options */}
              {isLogin && (
                <div className="mt-6">
                  <OAuthLogin onError={setError} />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
