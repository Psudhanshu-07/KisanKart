"use client";

import React from "react";
import Link from "next/link";
import { useApp, Role } from "@/context/AppContext";
import { ShieldAlert, ArrowLeft, LogIn, ShoppingBag, Sprout, LayoutDashboard } from "lucide-react";

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: Role[];
  portalName: string;
}

export function RoleGuard({ children, allowedRoles, portalName }: RoleGuardProps) {
  const { currentUser, role } = useApp();

  // If no user is logged in, or the user's role is not authorized for this portal:
  const activeRole = currentUser?.role || role;
  const isAuthorized = allowedRoles.includes(activeRole);

  if (!isAuthorized) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-2xl border border-rose-200 shadow-xl p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center mx-auto shadow-sm">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="inline-block px-3 py-1 bg-rose-50 text-rose-700 text-xs font-bold rounded-full uppercase tracking-wider">
              403 • Access Denied
            </span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">
              Restricted Portal Area
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">
              The <strong className="text-slate-900">{portalName}</strong> is only accessible by{" "}
              {allowedRoles.map((r) => r.toUpperCase()).join(" or ")} accounts.
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
            Current Session:{" "}
            <span className="font-semibold text-slate-900">
              {currentUser ? `${currentUser.full_name} (${currentUser.role.toUpperCase()})` : "Unauthenticated Guest"}
            </span>
          </div>

          <div className="space-y-2 pt-2">
            {activeRole === "farmer" || activeRole === "fpo" ? (
              <Link
                href="/farmer/dashboard"
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition"
              >
                <Sprout className="w-4 h-4" /> Go to Farmer / FPO Portal
              </Link>
            ) : activeRole === "admin" ? (
              <Link
                href="/admin/dashboard"
                className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition"
              >
                <LayoutDashboard className="w-4 h-4" /> Go to Admin Dashboard
              </Link>
            ) : (
              <Link
                href="/shop"
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition"
              >
                <ShoppingBag className="w-4 h-4" /> Go to Consumer Shop
              </Link>
            )}

            <Link
              href="/login"
              className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition"
            >
              <LogIn className="w-4 h-4" /> Sign In with Authorized Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

