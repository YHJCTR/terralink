"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { TL } from "@/lib/terralink";

export default function Toolbar() {
  const [user, setUser] = useState<{ user_id: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await TL.me();
        setUser(userData);
      } catch (error) {
        console.error("Failed to fetch user:", error);
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (loading) {
    return (
      <div className="bg-white shadow-sm border-b px-6 py-4">
        <div className="flex justify-between items-center">
          <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
          <div className="h-8 bg-gray-200 rounded w-20 animate-pulse"></div>
        </div>
      </div>
    );
  }



  return (
    <div className="bg-white shadow-sm border-b">
      <div className="px-6 py-4">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Terralink Console</h1>
            {user && (
              <p className="text-sm text-gray-600">Welcome, {user.user_id}</p>
            )}
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
      
      {/* Navigation Menu */}
      <div className="px-6 py-2 border-t border-gray-100">
        <nav className="flex space-x-6">
          <Link 
            href="/toolkits" 
            className={`text-sm font-medium transition-colors hover:text-blue-600 ${
              pathname === '/toolkits' ? 'text-blue-700 font-bold' : 'text-gray-700'
            }`}
          >
            Toolkits
          </Link>
          <Link 
            href="/my-toolkits" 
            className={`text-sm font-medium transition-colors hover:text-blue-600 ${
              pathname === '/my-toolkits' ? 'text-blue-700 font-bold' : 'text-gray-700'
            }`}
          >
            My Toolkits
          </Link>
          <Link 
            href="/app" 
            className={`text-sm font-medium transition-colors hover:text-blue-600 ${
              pathname === '/app' ? 'text-blue-700 font-bold' : 'text-gray-700'
            }`}
          >
            Console
          </Link>
          <Link
            href="/execution-history"
            className={`text-sm font-medium transition-colors hover:text-blue-600 ${
              pathname === '/execution-history' ? 'text-blue-700 font-bold' : 'text-gray-700'
            }`}
          >
            Execution History
          </Link>
          <Link
            href="/agent"
            className={`text-sm font-medium transition-colors hover:text-blue-600 ${
              pathname === '/agent' ? 'text-blue-700 font-bold' : 'text-gray-700'
            }`}
          >
            Agent
          </Link>
        </nav>
      </div>
    </div>
  );
}
