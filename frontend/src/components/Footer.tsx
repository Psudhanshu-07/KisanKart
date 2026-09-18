import React from "react";
import Link from "next/link";
import { Sprout, ShieldCheck, Cpu, Truck, BarChart3 } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white font-bold">
                <Sprout className="w-5 h-5" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">
                Kisan<span className="text-orange-400">Kart</span>
              </span>
            </div>
            <p className="text-slate-400 text-sm leading-relaxed max-w-lg mb-4">
              Fresh fruits and vegetables sold directly by farmers and FPOs with transparent pricing, verified quality, and simple direct payment collection.
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              <span className="bg-slate-800 text-orange-300 px-2.5 py-1 rounded-md border border-slate-700">
                Direct farmer sales
              </span>
              <span className="bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md border border-slate-700">
                Buyer-first shopping
              </span>
              <span className="bg-slate-800 text-amber-300 px-2.5 py-1 rounded-md border border-slate-700">
                No platform fee
              </span>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold text-sm mb-3 uppercase tracking-wider">
              Quick Links
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/shop" className="text-slate-400 hover:text-orange-400 transition">
                  Shop Fresh Produce
                </Link>
              </li>
              <li>
                <Link href="/buyer/requirement" className="text-slate-400 hover:text-orange-400 transition">
                  Bulk Requirement
                </Link>
              </li>
              <li>
                <Link href="/login" className="text-slate-400 hover:text-orange-400 transition">
                  Farmer & Buyer Login
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-slate-400 hover:text-orange-400 transition">
                  Create New Account
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <p>© 2026 KisanKart — Direct fruit and vegetable marketplace.</p>
          <p>Built with Next.js, React, Tailwind CSS, Python FastAPI, and SQLAlchemy.</p>
        </div>
      </div>
    </footer>
  );
}

