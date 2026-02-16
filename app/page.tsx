"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Zap, Shield, Search } from "lucide-react";

export default function Home() {
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/session/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to join session");
      }

      router.push(`/join/${code.toUpperCase()}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50 text-gray-900 font-sans">
      {/* Header */}
      <header className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-gray-200 z-50">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-sm">
              <Zap size={18} fill="currentColor" />
            </div>
            <span className="text-xl font-bold tracking-tight text-gray-900">edept polls</span>
          </div>
          <a
            href="/admin/login"
            className="text-sm font-medium text-gray-500 transition-colors hover:text-indigo-600"
          >
            Admin Login
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex flex-1 flex-col items-center justify-center px-4 pt-24 pb-12">
        <div className="w-full max-w-2xl">
          {/* Logo & Intro */}
          <div className="mb-12 text-center text-black">
            <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl leading-tight">
              Engage your <span className="text-indigo-600">audience</span> in real-time.
            </h1>
            <p className="mt-4 text-lg text-gray-600">
              Join a live session to participate in polls and Q&A.
            </p>
          </div>

          {/* Join Card */}
          <div className="mx-auto max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
            <div className="mb-6 flex flex-col items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 text-indigo-600">
                <Search size={24} />
              </div>
              <h2 className="text-xl font-bold text-black">Enter Session Code</h2>
            </div>

            {error && (
              <div className="mb-6 rounded-lg bg-red-50 p-4 text-sm font-medium text-red-700 border border-red-100">
                {error}
              </div>
            )}

            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <input
                  id="session-code"
                  type="text"
                  placeholder="CODE123"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="block w-full rounded-xl border border-gray-200 bg-gray-50 p-4 text-center text-3xl font-black tracking-widest text-gray-900 placeholder-gray-300 outline-none transition-all focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10"
                  maxLength={6}
                  required
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-indigo-600 px-6 py-4 text-lg font-bold text-white transition-all hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50"
              >
                {loading ? (
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                ) : (
                  <>
                    <span>Join Session</span>
                    <Zap size={20} className="fill-white" />
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Quick Features */}
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border border-gray-200 shadow-sm transition-transform hover:-translate-y-1">
                <Zap size={20} className="text-amber-500" />
              </div>
              <p className="text-sm font-semibold text-gray-700">Real-time</p>
            </div>
            <div className="flex flex-col items-center gap-3 text-center text-black">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border border-gray-200 shadow-sm transition-transform hover:-translate-y-1">
                <Users size={20} className="text-indigo-600" />
              </div>
              <p className="text-sm font-semibold text-gray-700 font-black">Anonymous</p>
            </div>
            <div className="flex flex-col items-center gap-3 text-center">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white border border-gray-200 shadow-sm transition-transform hover:-translate-y-1">
                <Shield size={20} className="text-emerald-600" />
              </div>
              <p className="text-sm font-semibold text-gray-700">Secure</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-gray-200 bg-white py-8">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <p className="text-sm text-gray-400">
            &copy; {new Date().getFullYear()} edept. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
