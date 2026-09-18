"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import {
  Sprout,
  ArrowRight,
  Cpu,
  TrendingUp,
  Truck,
  ShieldCheck,
  ShoppingBag,
  Layers,
  Sparkles,
  Users,
  CheckCircle2,
  Building2,
  BarChart3,
  Lock,
  FileText
} from "lucide-react";
import { getAdminDashboard } from "@/lib/api";

export default function HomePage() {
  const { t } = useApp();

  return (
    <div className="space-y-16 pb-20">
      <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50 via-white to-slate-50 border-b border-emerald-100/60 pt-16 pb-20">
        <div className="absolute top-0 right-0 -mr-20 -mt-20 w-96 h-96 rounded-full bg-emerald-200/30 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 rounded-full bg-amber-200/20 blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-semibold uppercase tracking-wider mb-6 shadow-sm">
              <Sprout className="w-3.5 h-3.5 text-emerald-700" />
              <span>Public marketplace for farmers and consumers</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-tight mb-6">
              Fresh produce, direct from the farm —{" "}
              <span className="text-emerald-700 underline decoration-emerald-300 decoration-wavy decoration-2">
                KisanKart.
              </span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 leading-relaxed mb-8">
              KisanKart is a transparent marketplace where farmers and FPOs list fruits and vegetables, consumers buy directly, and payment is settled through farmer or FPO verified UPI/payment details without platform fees.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/shop"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-base shadow-lg shadow-emerald-700/20 transition transform active:scale-95"
              >
                <ShoppingBag className="w-5 h-5" />
                <span>Browse Produce</span>
              </Link>

              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-base shadow-sm transition"
              >
                <Sprout className="w-5 h-5 text-emerald-600" />
                <span>Farmer / FPO Login</span>
              </Link>
            </div>

            <div className="mt-12 pt-8 border-t border-slate-200/80 text-left">
              <div className="rounded-3xl border border-dashed border-emerald-300 bg-white p-8 text-center">
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-700 mb-3">Marketplace status</div>
                <h2 className="text-3xl font-black text-slate-900 mb-2">No products listed yet</h2>
                <p className="text-slate-600 max-w-2xl mx-auto">
                  The marketplace is intentionally empty at launch so farmers and FPOs can list fresh produce as soon as they are ready. Consumers will see live stock only when sellers add listings.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-xs font-bold text-orange-700 tracking-wider uppercase mb-2">
            Built for trust
          </h2>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Simple experiences for farmers and buyers
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-orange-100 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-800 flex items-center justify-center">
                <Sprout className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Farmer / FPO account</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Create a trusted seller profile, add payment details like UPI or bank account, list produce with transparent pricing, and receive direct payments without platform fees.
              </p>
              <ul className="text-xs text-slate-700 space-y-2 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-orange-600 shrink-0" /> <span>Seller profile and address setup</span></li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-orange-600 shrink-0" /> <span>UPI / bank payment capture</span></li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-orange-600 shrink-0" /> <span>Fresh produce listing workflow</span></li>
              </ul>
            </div>

            <div className="pt-6">
              <Link href="/register" className="w-full py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition">
                <span>Create Farmer Account</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>

          <div className="bg-white border border-orange-100 rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-sm hover:shadow-md transition">
            <div className="space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Buyer account</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Shoppers can sign in with their own details, add delivery address, place orders, and pay for products using direct payment instructions from verified sellers.
              </p>
              <ul className="text-xs text-slate-700 space-y-2 pt-2 border-t border-slate-100">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-orange-600 shrink-0" /> <span>Simple sign in and secure checkout</span></li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-orange-600 shrink-0" /> <span>Saved delivery address</span></li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-orange-600 shrink-0" /> <span>Direct purchase flow</span></li>
              </ul>
            </div>

            <div className="pt-6">
              <Link href="/shop" className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition">
                <span>Browse Consumer Shop</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FOUR CORE TECHNICAL ENGINES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-xs font-bold text-emerald-700 tracking-wider uppercase mb-2">
            System Core
          </h2>
          <p className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            The Four Technical Engines Powering Farm2Market
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Engine A: Smart Matching */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-4">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">A. Smart Multi-Supplier Matching Engine</h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              When a buyer requests 1,000 kg Tomato, instead of rejecting or relying on a single large vendor,
              our knapsack solver coordinates multiple local farmers and FPOs (e.g. 400 kg + 350 kg + 250 kg = 1,000 kg).
            </p>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs font-mono text-slate-700 space-y-1 mb-4">
              <div>• 40.0% Quantity Match & Fulfilment</div>
              <div>• 20.0% Distance & Regional Corridor</div>
              <div>• 15.0% Price Realisation vs Budget</div>
              <div>• 15.0% Quality Grade Consistency</div>
              <div>• 10.0% Delivery Reliability & Trust</div>
            </div>
            <Link
              href="/buyer/requirement"
              className="text-emerald-700 hover:text-emerald-800 font-bold text-xs inline-flex items-center gap-1"
            >
              Test Multi-Supplier Plan Generator →
            </Link>
          </div>

          {/* Engine B: Demand Forecasting */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center mb-4">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">B. AI Demand Forecasting Engine</h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              Combines historical orders, regional consumption patterns, and upcoming festival spikes
              (e.g., Ganesh Chaturthi) to forecast commodity demand and converts numbers directly into actionable decision cards.
            </p>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1 mb-4">
              <div className="font-semibold text-slate-900">AI Recommendation (Mumbai Tomato):</div>
              <div>&quot;Demand expected to rise by +26% (8,200 kg). Consider listing additional supply now.&quot;</div>
              <div className="text-emerald-700 font-semibold">Workflow: AI → Recommendation → Action</div>
            </div>
            <Link
              href="/admin/login"
              className="text-emerald-700 hover:text-emerald-800 font-bold text-xs inline-flex items-center gap-1"
            >
              Inspect Regional Forecast & Gap Maps →
            </Link>
          </div>

          {/* Engine C: Logistics & Route Optimisation */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mb-4">
              <Truck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">C. Logistics & Route Optimisation Engine</h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              Employs Google OR-Tools with Freshness-First heuristics. Coordinates multi-point pickups,
              tracks vehicle capacity (e.g. 700/1000 kg loaded), and handles real-time delay rescheduling.
            </p>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1 mb-4">
              <div>• 08:00 AM: Farmer A (300 kg)</div>
              <div>• 08:40 AM: FPO Collection Hub (400 kg)</div>
              <div>• Capacity Meter: 700 kg loaded / 300 kg available</div>
              <div>• Delay handling: 18 min delay recalculated to 11:48 AM ETA</div>
            </div>
            <Link
              href="/driver"
              className="text-emerald-700 hover:text-emerald-800 font-bold text-xs inline-flex items-center gap-1"
            >
              Open Driver Console (&quot;START ROUTE&quot;) →
            </Link>
          </div>

          {/* Engine D: Trust & Transparency */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 hover:shadow-md transition">
            <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-800 flex items-center justify-center mb-4">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">D. Trust + Transparency Engine</h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-4">
              Provides explainable matching (&quot;Why 94%?&quot;), multi-stakeholder Trust Scores (94/100),
              scannable Digital Lot Produce Passports, and transparent price breakdowns.
            </p>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-1 mb-4">
              <div className="font-semibold text-slate-900">Consumer Price ₹32/kg Breakdown:</div>
              <div className="flex justify-between"><span>Farmer Realisation:</span> <span className="font-semibold text-emerald-700">₹27.00 (84.4%)</span></div>
              <div className="flex justify-between"><span>Logistics Transport:</span> <span className="font-semibold">₹3.00 (9.4%)</span></div>
              <div className="flex justify-between"><span>Platform & QC:</span> <span className="font-semibold">₹2.00 (6.2%)</span></div>
            </div>
            <Link
              href="/lot/LOT-TOM-NK-2609-00421"
              className="text-emerald-700 hover:text-emerald-800 font-bold text-xs inline-flex items-center gap-1"
            >
              Scan Live Digital Lot QR Passport →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
