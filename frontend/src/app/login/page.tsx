"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { loginUser } from "@/lib/api";
import {
  Sprout,
  ShoppingBag,
  ArrowRight,
  Sparkles,
  Lock,
  Mail,
  CheckCircle2,
  AlertCircle,
  Building2,
  UserCheck
} from "lucide-react";

export default function PublicLoginPage() {
  const router = useRouter();
  const { loginSession } = useApp();

  const [selectedType, setSelectedType] = useState<"farmer_fpo" | "consumer" | "admin">("farmer_fpo");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSelectType = (type: "farmer_fpo" | "consumer" | "admin") => {
    setSelectedType(type);
    setErrorMessage("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const res = await loginUser({ email, password });

      loginSession({
        user_id: res.user_id,
        email: res.email,
        full_name: res.full_name,
        role: res.role,
        access_token: res.access_token
      });

      if (res.role === "admin") {
        router.push("/admin/dashboard");
      } else if (res.role === "farmer" || res.role === "fpo") {
        router.push("/farmer/dashboard");
      } else {
        router.push("/shop");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Invalid credentials. Please verify and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 bg-gradient-to-b from-emerald-50/40 via-white to-slate-50">
      <div className="max-w-md w-full space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>KisanKart Unified Authentication</span>
          </div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Sign In to KisanKart
          </h1>
          <p className="text-sm text-slate-600">
            Select your account type to access your dedicated portal
          </p>
        </div>

        {/* Public Role Toggle Buttons */}
        <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button
            type="button"
            onClick={() => handleSelectType("farmer_fpo")}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
              selectedType === "farmer_fpo"
                ? "bg-white text-emerald-800 shadow-md border border-emerald-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Sprout className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Farmer/FPO</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectType("consumer")}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
              selectedType === "consumer"
                ? "bg-white text-emerald-800 shadow-md border border-emerald-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Consumer</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectType("admin")}
            className={`flex items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-xs font-bold transition-all ${
              selectedType === "admin"
                ? "bg-white text-slate-900 shadow-md border border-slate-300"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-slate-700 shrink-0" />
            <span>Admin/Team</span>
          </button>
        </div>

        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 text-xs space-y-1">
          <span className="font-semibold text-slate-500 uppercase tracking-wider text-[10px]">
            Account access
          </span>
          <div className="text-slate-600">
            {selectedType === "farmer_fpo"
              ? "Farmer or FPO accounts can log in to list produce, manage UPI details, and track direct payments."
              : selectedType === "admin"
              ? "Platform administrators & evaluators can log in to access operations, dynamic pricing, and dispatch routing."
              : "Consumers can sign in to browse verified stock and place direct orders from farmers or FPOs."}
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-sm space-y-5">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900"
                placeholder="you@domain.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white text-slate-900"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 text-white font-bold rounded-xl shadow-md transition flex items-center justify-center gap-2 disabled:opacity-50 ${
              selectedType === "admin"
                ? "bg-slate-900 hover:bg-slate-800 shadow-slate-900/20"
                : "bg-emerald-600 hover:bg-emerald-700 shadow-emerald-700/20"
            }`}
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>
                  Enter{" "}
                  {selectedType === "farmer_fpo"
                    ? "Farmer / FPO Portal"
                    : selectedType === "admin"
                    ? "Admin Operations Portal"
                    : "Consumer Shop"}
                </span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center space-y-2.5 pt-1">
          <Link
            href="/register"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-orange-200 bg-orange-50 px-4 py-2.5 text-sm font-bold text-orange-700 hover:bg-orange-100 transition"
          >
            <span>Create a new KisanKart account</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <div>
            <Link
              href="/admin/login"
              className="text-xs text-slate-500 hover:text-slate-800 transition inline-flex items-center gap-1 font-medium"
            >
              <span>Dedicated Dark Console: Access Private Admin Gateway →</span>
            </Link>
          </div>

          <div className="text-center text-xs text-slate-500 pt-1">
            <span>Need help? Contact KisanKart Support: </span>
            <span className="font-semibold text-emerald-700">1800-266-KART</span>
          </div>
        </div>
      </div>
    </div>
  );
}

