"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import { Zap, ArrowLeft, Lock, Mail, Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

export default function AdminLogin() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await signInWithEmailAndPassword(auth, email, password);
            router.push("/admin/dashboard");
        } catch (err: any) {
            setError(err.message);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-white p-6 font-sans selection:bg-indigo-100 selection:text-indigo-900">
            <div className="w-full max-w-md relative">
                {/* Back to Home */}
                <Link 
                    href="/" 
                    className="absolute -top-16 left-0 flex items-center gap-2 text-sm font-bold text-slate-400 hover:text-slate-900 transition-all group"
                >
                    <ArrowLeft size={18} className="transition-transform group-hover:-translate-x-1" />
                    Back to Home
                </Link>

                <div className="rounded-[2.5rem] bg-white border border-slate-200 p-10 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.06)] ring-1 ring-slate-100">
                    <div className="mb-10 text-center">
                        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-indigo-600 text-white shadow-xl shadow-indigo-100">
                            <Zap size={32} fill="currentColor" />
                        </div>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900 mb-2">Host Login</h1>
                        <p className="text-sm font-medium text-slate-400 uppercase tracking-widest">Pulse Control Center</p>
                    </div>

                    {error && (
                        <div className="mb-8 rounded-2xl bg-rose-50 p-4 text-xs font-bold text-rose-600 border border-rose-100/50 text-center animate-shake">
                            Authentication failed. Please check your credentials.
                        </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Email Address</label>
                            <div className="relative group">
                                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors">
                                    <Mail size={18} />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full rounded-2xl border-none bg-slate-50 pl-14 pr-6 py-5 text-sm font-bold text-slate-900 placeholder-slate-300 outline-none ring-2 ring-slate-100 focus:ring-indigo-600 focus:bg-white transition-all"
                                    placeholder="admin@pulse.live"
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Password</label>
                            <div className="relative group">
                                <div className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-600 transition-colors">
                                    <Lock size={18} />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full rounded-2xl border-none bg-slate-50 pl-14 pr-6 py-5 text-sm font-bold text-slate-900 placeholder-slate-300 outline-none ring-2 ring-slate-100 focus:ring-indigo-600 focus:bg-white transition-all"
                                    placeholder="••••••••"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="group relative flex w-full items-center justify-center gap-4 overflow-hidden rounded-2xl bg-slate-900 px-6 py-5 text-sm font-black uppercase tracking-widest text-white transition-all hover:bg-slate-800 active:scale-[0.98] shadow-xl shadow-slate-200"
                        >
                            <span>Enter Dashboard</span>
                        </button>
                    </form>

                    
                </div>
            </div>
        </div>
    );
}
