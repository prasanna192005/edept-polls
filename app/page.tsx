"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-indigo-500 to-purple-600 p-4 text-white">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-gray-900 shadow-2xl">
        <h1 className="mb-2 text-center text-3xl font-extrabold text-indigo-700">Live Polls</h1>
        <p className="mb-8 text-center text-gray-500">Enter a code to join the session</p>

        {error && <div className="mb-4 rounded bg-red-100 p-3 text-sm text-red-600">{error}</div>}

        <form onSubmit={handleJoin} className="space-y-6">
          <div>
            <input
              type="text"
              placeholder="Session Code (e.g. ABC123)"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-4 text-center text-2xl font-bold tracking-widest text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-indigo-500"
              maxLength={6}
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-indigo-600 px-4 py-3 text-lg font-bold text-white hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Joining..." : "Join Session"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-400">
          <a href="/admin/login" className="hover:text-indigo-600 hover:underline">Admin Login</a>
        </div>
      </div>
    </div>
  );
}
