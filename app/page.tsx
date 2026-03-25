"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Zap, Shield, Search, ArrowRight, Github, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

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
    <div className="flex min-h-screen flex-col bg-white text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/90 border-b border-slate-100 z-50 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6 lg:px-8">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm shadow-indigo-200">
              <Zap size={20} fill="currentColor" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">Pulse</span>
          </div>
          
          <div className="hidden sm:flex items-center gap-6">
            <a
              href="https://github.com/prasanna192005/Pulse-free-ppt-polls"
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 text-sm font-bold text-slate-400 transition-all hover:text-slate-900"
            >
              <Github size={18} className="transition-transform group-hover:scale-110" />
              Source
            </a>
            <div className="w-px h-4 bg-slate-100" />
            <a
              href="/admin/login"
              className="flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2 text-xs font-black uppercase tracking-widest text-white transition-all hover:bg-indigo-600 hover:shadow-lg hover:shadow-indigo-200 active:scale-95"
            >
              <Lock size={12} />
              Host Session
            </a>
          </div>

          {/* Mobile Admin Link */}
          <a href="/admin/login" className="sm:hidden text-slate-400 hover:text-indigo-600">
            <Lock size={18} />
          </a>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center px-6 pt-32 pb-20">
        <div className="w-full max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            
            {/* Left Column: Hero Text */}
            <div className="text-center lg:text-left space-y-8">
              <div className="inline-flex items-center rounded-full bg-indigo-50 px-4 py-1.5 text-xs font-black tracking-widest uppercase text-indigo-600 border border-indigo-100/50">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 animate-pulse mr-2" />
                Real-time Feedback
              </div>
              <h1 className="text-5xl font-black tracking-tight sm:text-7xl text-slate-900 leading-[1.05]">
                Engagement,<br/>
                <span className="text-indigo-600">Simplified.</span>
              </h1>
              <p className="max-w-xl mx-auto lg:mx-0 text-lg text-slate-500 leading-relaxed font-medium">
                Pulse helps presenters connect with their audience instantly. No accounts, no friction, just real-time connection from any device.
              </p>
              
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-4">
                <a 
                  href="https://github.com/prasanna192005/Pulse-free-ppt-polls" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-6 py-3 rounded-2xl bg-white border-2 border-slate-100 text-sm font-bold text-slate-600 hover:border-slate-200 hover:bg-slate-50 transition-all active:scale-95"
                >
                  <Github size={20} />
                  Star on GitHub
                </a>
              </div>
            </div>

            {/* Right Column: Join Session Card */}
            <div className="relative">
              {/* Decorative Elements */}
              <div className="absolute -top-12 -right-12 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-60 mix-blend-multiply" />
              <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-slate-100 rounded-full blur-3xl opacity-60 mix-blend-multiply" />

              <div className="relative bg-white rounded-[2.5rem] border border-slate-200 p-2 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)] ring-1 ring-slate-100">
                <div className="p-8 sm:p-12">
                  <div className="mb-10 text-center lg:text-left">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight mb-2">Join Session</h2>
                    <p className="text-sm font-medium text-slate-400">Enter the unique access code below</p>
                  </div>

                  {error && (
                    <div className="mb-8 rounded-2xl bg-rose-50 p-4 text-xs font-bold text-rose-600 border border-rose-100/50 text-center animate-shake">
                      {error}
                    </div>
                  )}

                  <form onSubmit={handleJoin} className="space-y-6">
                    <div className="group relative">
                      <input
                        id="session-code"
                        type="text"
                        placeholder="CODE123"
                        value={code}
                        onChange={(e) => setCode(e.target.value.toUpperCase())}
                        className="block w-full rounded-2xl border-none bg-slate-50 px-6 py-8 text-center text-4xl font-black tracking-[0.25em] text-slate-900 placeholder-slate-200 outline-none ring-2 ring-slate-100 focus:ring-indigo-600 focus:bg-white transition-all shadow-inner"
                        maxLength={6}
                        required
                        autoFocus
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="group relative flex w-full items-center justify-center gap-4 overflow-hidden rounded-2xl bg-slate-900 px-6 py-6 text-sm font-black uppercase tracking-widest text-white transition-all hover:bg-indigo-600 hover:shadow-xl hover:shadow-indigo-200 active:scale-[0.98] disabled:opacity-50"
                    >
                      {loading ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                      ) : (
                        <>
                          <span>Enter Room</span>
                          <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>

          {/* Features Grid */}
          <div className="mt-32 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {[
              { icon: Zap, label: "Instant", sub: "Real-time sync", color: "text-amber-500", bg: "bg-amber-50" },
              { icon: Users, label: "Anonymous", sub: "Privacy first", color: "text-indigo-600", bg: "bg-indigo-50" },
              { icon: Shield, label: "Secure", sub: "End-to-end", color: "text-emerald-600", bg: "bg-emerald-50" }
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-6 p-6 rounded-3xl border border-slate-100 hover:border-indigo-100 hover:bg-indigo-50/10 transition-all group">
                <div className={cn("flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-transparent shadow-sm transition-all group-hover:scale-110", feature.bg)}>
                  <feature.icon size={28} className={feature.color} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">{feature.label}</h3>
                  <p className="text-xs font-black text-slate-400 mt-0.5 tracking-widest uppercase">{feature.sub}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-slate-100 bg-white py-16">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900 text-white">
                <Zap size={16} fill="currentColor" />
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900 uppercase italic">Pulse</span>
            </div>
            
            <div className="flex flex-col items-center md:items-end gap-2">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                Built with ⚡ by 
                <a 
                  href="https://github.com/prasanna192005" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-slate-900 hover:text-indigo-600 transition-colors underline decoration-indigo-200 decoration-2 underline-offset-4"
                >
                  @prasanna192005
                </a>
              </p>
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">
                &copy; {new Date().getFullYear()} Pulse Project. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
