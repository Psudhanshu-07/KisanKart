"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { loginUser } from "@/lib/api";
import {
  ShieldCheck,
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Terminal,
  KeyRound
} from "lucide-react";

export default function PrivateAdminLoginPage() {
  const router = useRouter();
  const { loginSession } = useApp();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const res = await loginUser({ email, password });

      if (res.role !== "admin") {
        setErrorMessage("Access denied. This portal is strictly restricted to platform administrators.");
        setLoading(false);
        return;
      }

      loginSession({
        user_id: res.user_id,
        email: res.email,
        full_name: res.full_name,
        role: "admin",
        access_token: res.access_token
      });

      router.push("/admin/dashboard");
    } catch (err: any) {
      setErrorMessage(err.message || "Invalid administrator credentials.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-slate-950 text-slate-100">
      <div className="max-w-md w-full space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
            <ShieldCheck className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <span className="inline-block px-3 py-0.5 bg-emerald-950 border border-emerald-800 text-emerald-400 text-[11px] font-bold rounded-full uppercase tracking-wider">
              Internal Administration Gateway
            </span>
            <h1 className="text-2xl font-black tracking-tight text-white">
              KisanKart Operations Center
            </h1>
            <p className="text-xs text-slate-400">
              Authorized personnel only. Access is monitored and audited for platform governance.
            </p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="bg-slate-900/90 border border-slate-800 p-6 sm:p-8 rounded-2xl shadow-2xl space-y-5">
          {errorMessage && (
            <div className="p-3 bg-rose-950/60 border border-rose-800/80 rounded-xl text-xs text-rose-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white font-mono text-xs"
                placeholder="admin@yourdomain.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
              Secure Passkey
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-white font-mono text-xs"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-900/40 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span>Verifying Admin Token...</span>
            ) : (
              <>
                <span>Enter Admin Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center">
          <Link
            href="/login"
            className="text-xs text-slate-500 hover:text-slate-300 transition inline-flex items-center gap-1"
          >
            <span>← Return to Public User Sign In</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

