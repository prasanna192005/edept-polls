"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Zap, Shield, Search, ArrowRight, Github, Lock, Check, Globe, Layout, MousePointer2, BarChart2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Home() {
  const [code, setCode] = useState("");
  const [isFocused, setIsFocused] = useState(false);
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
    <div className="flex min-h-screen flex-col bg-white text-slate-600 font-sans selection:bg-indigo-50 selection:text-indigo-600 overflow-x-hidden">
      {/* Refined Navigation - Shifted Down & Floating */}
      <nav className="fixed top-8 left-1/2 -translate-x-1/2 w-[calc(100%-3rem)] max-w-7xl z-50 bg-white/80 backdrop-blur-md border border-slate-100 rounded-2xl shadow-sm">
        <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-white">
              <Zap size={14} fill="currentColor" />
            </div>
            <span className="text-sm font-bold tracking-tight text-slate-900 uppercase italic">Pulse</span>
          </div>
          
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/prasanna192005/Pulse-free-ppt-polls"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-bold text-slate-400 hover:text-slate-900 transition-colors"
            >
              GitHub
            </a>
            <a
              href="/admin/login"
              className="rounded-lg bg-slate-900 px-3.5 py-1.5 text-[11px] font-bold text-white transition-all hover:bg-indigo-600 active:scale-95"
            >
              Host Session
            </a>
          </div>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center pt-48 pb-20">
        <div className="w-full max-w-5xl mx-auto px-6">
          
          {/* Compressed Hero Section */}
          <div className="grid lg:grid-cols-2 gap-12 items-start mb-24">
            
            {/* Left: Content */}
            <div className="space-y-6 pt-4">
              <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded-md bg-slate-100 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                <span className="w-1 h-1 rounded-full bg-indigo-500" />
                Enterprise Polling
              </div>
              
              <div className="space-y-4">
                <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-slate-900 leading-[1.1]">
                  Engagement,<br/>
                  <span className="text-indigo-600">Perfected.</span>
                </h1>
                <p className="max-w-md text-sm font-medium text-slate-500 leading-relaxed">
                  The most refined way to connect with your audience. 
                  Lightweight, real-time, and designed for professional presentations.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-y-3 pt-2">
                 {[
                   "No signups required",
                   "Real-time analytics",
                   "Custom templates",
                   "Export to PPT",
                   "Anonymous participation",
                   "Mobile optimized"
                 ].map((t, i) => (
                   <div key={i} className="flex items-center gap-2 text-[11px] font-bold text-slate-400">
                      <div className="w-4 h-4 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 shrink-0">
                         <Check size={10} strokeWidth={3} />
                      </div>
                      {t}
                   </div>
                 ))}
              </div>

              <div className="pt-6 flex items-center gap-4">
                <a
                  href="/admin/login"
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-3 text-[11px] font-black uppercase tracking-widest text-white transition-all hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-100 active:scale-95"
                >
                  <Sparkles size={14} fill="currentColor" />
                  Host a Session
                </a>
                <a 
                  href="https://github.com/prasanna192005/Pulse-free-ppt-polls" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-slate-200 text-[11px] font-bold text-slate-600 hover:bg-slate-50 transition-all active:scale-95"
                >
                  <Github size={14} />
                  View Source
                </a>
              </div>
            </div>

            {/* Right: Compact Join Card - Shifted right and down */}
            <div className="bg-white border border-slate-200 rounded-3xl p-1.5 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] transform translate-x-6 translate-y-10">
              <div className="bg-slate-50/50 rounded-[1.25rem] p-8 space-y-8">
                <div className="space-y-1">
                  <h2 className="text-lg font-bold text-slate-900 tracking-tight">Join a Session</h2>
                  <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">Enter 6-digit access code</p>
                </div>

                {error && (
                  <div className="rounded-lg bg-rose-50 p-3 text-[10px] font-bold text-rose-600 border border-rose-100 text-center">
                    {error}
                  </div>
                )}

                <form onSubmit={handleJoin} className="space-y-8">
                  <div className="relative">
                    {/* Hidden input for real focus and capture */}
                    <input
                      id="session-code-hidden"
                      type="text"
                      maxLength={6}
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      onFocus={() => setIsFocused(true)}
                      onBlur={() => setIsFocused(false)}
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      autoFocus
                    />
                    
                    {/* Tactile Boxes */}
                    <div className="flex justify-between gap-2 pointer-events-none">
                      {[0, 1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className={cn(
                            "w-11 h-14 rounded-xl border-2 flex items-center justify-center text-2xl font-black transition-all",
                            (code.length === i && isFocused) ? "border-slate-900 bg-white shadow-sm ring-4 ring-slate-100 scale-105" : 
                            code[i] ? "border-slate-300 bg-white text-slate-900" : "border-slate-100 bg-slate-50/50 text-slate-200"
                          )}
                        >
                          {code[i] || ""}
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || code.length !== 6}
                    className="group flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-4 text-[11px] font-bold uppercase tracking-widest text-white transition-all hover:bg-indigo-600 active:scale-[0.98] disabled:opacity-30 disabled:hover:bg-slate-900"
                  >
                    {loading ? (
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                    ) : (
                      <>
                        <span>Join Room</span>
                        <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                      </>
                    )}
                  </button>
                </form>
                
                <p className="text-[10px] text-center text-slate-400 font-medium">
                  By joining, you agree to our anonymous participation guidelines.
                </p>
              </div>
            </div>
          </div>

          {/* High-Density Features Grid */}
          <div className="grid md:grid-cols-3 gap-8 py-16 border-t border-slate-100">
             {[
               { icon: MousePointer2, title: "Zero Friction", desc: "No registration or login required for participants." },
               { icon: Layout, title: "Art-Directed", desc: "Professional templates designed for high-end keynotes." },
               { icon: BarChart2, title: "Live Results", desc: "Instant data visualization with beautiful transitions." }
             ].map((f, i) => (
               <div key={i} className="space-y-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-900">
                     <f.icon size={20} />
                  </div>
                  <h3 className="text-sm font-bold text-slate-900">{f.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">{f.desc}</p>
               </div>
             ))}
          </div>

          {/* Why Pulse Section */}
          <div className="py-24 border-t border-slate-100 grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded-md bg-rose-50 text-[10px] font-bold uppercase tracking-wider text-rose-600">
                The Status Quo
              </div>
              <h2 className="text-3xl font-black tracking-tight text-slate-900 leading-tight">
                Engagement shouldn't <br/>
                be a luxury.
              </h2>
              <div className="space-y-4 text-sm font-medium text-slate-500 leading-relaxed max-w-lg">
                <p>
                  Most engagement tools today share the same problem: they lock basic human connection behind expensive monthly subscriptions and clunky "Pro" paywalls. 
                </p>
                <p>
                  Presenters are forced to choose between boring, static slides or managing complex, over-priced software that requires participant sign-ups.
                </p>
              </div>
            </div>
            <div className="lg:col-span-5 bg-slate-50 rounded-[2rem] p-8 space-y-6 border border-slate-100">
              <div className="space-y-2">
                 <h3 className="text-xs font-black uppercase tracking-widest text-slate-900">The Pulse Philosophy</h3>
                 <p className="text-[11px] font-medium text-slate-400">Why we built this platform</p>
              </div>
              <div className="space-y-4">
                 {[
                   { label: "Zero Paywalls", desc: "No subscriptions. No 'Pro' features. Just engagement." },
                   { label: "Zero Friction", desc: "No apps to download. No accounts for your audience." },
                   { label: "High Fidelity", desc: "Art-directed templates that match your premium slides." }
                 ].map((p, i) => (
                   <div key={i} className="flex gap-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                      <div className="space-y-1">
                        <p className="text-[11px] font-black uppercase tracking-wider text-slate-900">{p.label}</p>
                        <p className="text-[11px] font-medium text-slate-400">{p.desc}</p>
                      </div>
                   </div>
                 ))}
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Compact Footer */}
      <footer className="w-full border-t border-slate-100 bg-slate-50/30 py-10">
        <div className="mx-auto max-w-5xl px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Zap size={14} className="text-slate-900" fill="currentColor" />
            <span className="text-xs font-bold text-slate-900 uppercase italic">Pulse</span>
            <span className="text-[10px] font-medium text-slate-300">| Free & Open Source</span>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            &copy; {new Date().getFullYear()} Pulse Project.
          </p>
        </div>
      </footer>
    </div>
  );
}
