"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { generateSmartSupplyPlan, confirmProcurementPlan } from "@/lib/api";
import confetti from "canvas-confetti";
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Clock,
  CheckCircle2,
  HelpCircle,
  X,
  Truck,
  Building2,
  FileCheck2,
  ChevronRight,
  AlertCircle
} from "lucide-react";

export default function BuyerRequirementPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm text-slate-500">Loading Requirement Portal...</div>}>
      <BuyerRequirementContent />
    </Suspense>
  );
}

function BuyerRequirementContent() {
  const { t } = useApp();
  const router = useRouter();
  const searchParams = useSearchParams();

  // Form State with standard SIH demo default values
  const [crop, setCrop] = useState(searchParams?.get("crop") || "Tomato");
  const [quantity, setQuantity] = useState(Number(searchParams?.get("qty")) || 1000);
  const [grade, setGrade] = useState("A");
  const [district, setDistrict] = useState("Mumbai");
  const [deliveryDate, setDeliveryDate] = useState("2026-09-20");

  // Flow State
  const [analyzing, setAnalyzing] = useState(false);
  const [plan, setPlan] = useState<any>(null);
  const [selectedSupplierForWhy, setSelectedSupplierForWhy] = useState<any>(null);
  const [confirming, setConfirming] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<any>(null);

  const handleFindSupply = async (e: React.FormEvent) => {
    e.preventDefault();
    setAnalyzing(true);
    setPlan(null);
    try {
      // Simulate real-time knapsack solver analysis delay for presentation
      await new Promise((r) => setTimeout(r, 1200));
      const res = await generateSmartSupplyPlan({
        crop,
        quantity: Number(quantity),
        grade,
        district,
        delivery_date: deliveryDate
      });
      setPlan(res);
    } catch (err) {
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleConfirmPlan = async () => {
    setConfirming(true);
    try {
      const res = await confirmProcurementPlan({
        requirement_id: plan?.requirement_id,
        delivery_address: "Central Kitchen Hub, Unit 14, APMC Commercial Complex, Navi Mumbai",
        destination_city: district,
        plan_data: plan
      });
      setConfirmedOrder(res);
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (e) {
      console.error(e);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <div className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 text-xs font-semibold px-3 py-1 rounded-full mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Intelligent Multi-Supplier Procurement</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Post Procurement Requirement
        </h1>
        <p className="text-sm sm:text-base text-slate-600 mt-2">
          {t.buyer.subtitle}
        </p>
      </div>

      {/* Requirement Form Card */}
      {!confirmedOrder && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
          <form onSubmit={handleFindSupply} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {/* Product */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  {t.buyer.productLabel}
                </label>
                <select
                  value={crop}
                  onChange={(e) => setCrop(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Tomato">Tomato (टमाटर)</option>
                  <option value="Onion">Onion (कांदा / प्याज)</option>
                  <option value="Potato">Potato (बटाटा / आलू)</option>
                  <option value="Grapes">Grapes (द्राक्षे / अंगूर)</option>
                  <option value="Wheat">Wheat (गहू / गेहूं)</option>
                  <option value="Banana">Banana (केळी / केला)</option>
                </select>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  {t.buyer.quantityLabel}
                </label>
                <input
                  type="number"
                  min="50"
                  step="50"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              {/* Grade */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  {t.buyer.gradeLabel}
                </label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="A">Grade A — Premium / Export / Hotel</option>
                  <option value="B">Grade B — Retail / Kitchen Standard</option>
                  <option value="C">Grade C — Bulk Food Processing</option>
                </select>
              </div>

              {/* Delivery Location */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  {t.buyer.locationLabel}
                </label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="Mumbai">Mumbai (Central Kitchen Hub)</option>
                  <option value="Pune">Pune Urban Hub</option>
                  <option value="Nashik">Nashik Commercial Yard</option>
                  <option value="Nagpur">Nagpur Terminal</option>
                </select>
              </div>

              {/* Delivery Window */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
                  {t.buyer.deliveryDateLabel}
                </label>
                <input
                  type="date"
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              {/* Submit CTA */}
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={analyzing}
                  className="w-full py-2.5 px-6 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2 h-[42px]"
                >
                  {analyzing ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                      <span>Analysing...</span>
                    </span>
                  ) : (
                    <span>Find Supply</span>
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Analyzing Animation State */}
      {analyzing && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center space-y-3 animate-pulse">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-emerald-900 font-bold text-base">
            Analysing available supply across verified farmers & FPOs...
          </p>
          <p className="text-xs text-emerald-700 max-w-md mx-auto">
            Applying 5-factor normalized weights: Quantity (40%), Distance (20%), Price (15%), Quality (15%), and Reliability (10%).
          </p>
        </div>
      )}

      {/* SMART SUPPLY PLAN DISPLAY */}
      {plan && !confirmedOrder && (
        <div className="bg-white border-2 border-emerald-600 rounded-3xl overflow-hidden shadow-lg space-y-6">
          {/* Header Banner */}
          <div className="bg-emerald-700 text-white p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="bg-emerald-800/80 px-2.5 py-0.5 rounded text-xs font-semibold uppercase tracking-wider text-emerald-200">
                Multi-Supplier Aggregation Plan
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold mt-1">
                Smart Supply Plan Ready
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100 mt-1">
                Coordinating {plan.supplier_count} verified suppliers across {plan.pickup_points_count} pickup points in Nashik to fulfill your {plan.required_quantity} kg requirement.
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/20">
              <div className="text-xs text-emerald-200 uppercase font-semibold">Overall Match</div>
              <div className="text-3xl font-black text-white">{plan.overall_matching_score}%</div>
              <div className="text-[11px] text-emerald-200">Smart Match</div>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-8">
            {/* KPI Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                <span className="text-xs text-slate-500 font-medium">Required vs Matched</span>
                <div className="text-xl font-bold text-slate-900 mt-0.5">
                  {plan.matched_quantity} / {plan.required_quantity} kg
                </div>
                <div className="text-[11px] text-emerald-600 font-semibold">100% Fulfilled</div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                <span className="text-xs text-slate-500 font-medium">Coordinated Suppliers</span>
                <div className="text-xl font-bold text-slate-900 mt-0.5">
                  {plan.supplier_count} Farmers / FPOs
                </div>
                <div className="text-[11px] text-slate-500 font-medium">{plan.pickup_points_count} Pickup Hubs</div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                <span className="text-xs text-slate-500 font-medium">Weighted Farm Price</span>
                <div className="text-xl font-bold text-emerald-700 mt-0.5">
                  ₹{plan.average_price}/kg
                </div>
                <div className="text-[11px] text-slate-500">Ex-Farm Realisation</div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                <span className="text-xs text-slate-500 font-medium">Estimated Arrival</span>
                <div className="text-base font-bold text-slate-900 mt-0.5">
                  24-36 Hours
                </div>
                <div className="text-[11px] text-emerald-600 font-semibold">Freshness Guard</div>
              </div>
            </div>

            {/* Matched Suppliers Breakdown */}
            <div className="space-y-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center justify-between">
                <span>Matched Supplier Breakdown</span>
                <span className="text-xs font-normal text-slate-500">
                  Click &apos;Why this match?&apos; for explainable AI subscores
                </span>
              </h3>

              <div className="space-y-3">
                {plan.matched_suppliers.map((item: any, idx: number) => (
                  <div
                    key={idx}
                    className="bg-slate-50 hover:bg-slate-100/80 border border-slate-200 rounded-xl p-4 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-100 text-emerald-800">
                          {item.supplier_type}
                        </span>
                        <h4 className="font-bold text-slate-900 text-sm">
                          {item.supplier_name}
                        </h4>
                      </div>
                      <div className="flex items-center gap-4 text-xs text-slate-600">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {item.pickup_location} ({Math.round(item.distance_km)} km)
                        </span>
                        <span>•</span>
                        <span>₹{item.price_per_unit}/kg</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-2 md:pt-0 border-slate-200">
                      <div className="text-right">
                        <div className="text-xs text-slate-500">Allocated Quantity</div>
                        <div className="text-base font-bold text-slate-900">
                          {item.quantity_allocated} kg
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedSupplierForWhy(item)}
                        className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:border-emerald-500 text-xs font-bold text-emerald-800 shadow-sm transition flex items-center gap-1"
                      >
                        <HelpCircle className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Why {Math.round(item.score_percentage)}%?</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Transparent Price Breakdown */}
            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-amber-950 text-sm flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  <span>Transparent Price Breakdown (₹/kg)</span>
                </h4>
                <span className="text-[11px] text-amber-800 font-semibold bg-amber-100/80 px-2 py-0.5 rounded">
                  Demo Pricing Breakdown
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center text-xs">
                <div className="bg-white p-2.5 rounded-lg border border-amber-200">
                  <div className="text-slate-500 font-medium">Farmer Realisation</div>
                  <div className="text-base font-bold text-slate-900">
                    ₹{plan.price_breakdown.farmer_realisation}
                  </div>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-amber-200">
                  <div className="text-slate-500 font-medium">Logistics & Transit</div>
                  <div className="text-base font-bold text-slate-900">
                    ₹{plan.price_breakdown.logistics}
                  </div>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-amber-200">
                  <div className="text-slate-500 font-medium">Platform / Service</div>
                  <div className="text-base font-bold text-slate-900">
                    ₹{plan.price_breakdown.platform_service}
                  </div>
                </div>
                <div className="bg-white p-2.5 rounded-lg border border-amber-200">
                  <div className="text-slate-500 font-medium">Packaging & QC</div>
                  <div className="text-base font-bold text-slate-900">
                    ₹{plan.price_breakdown.quality_packaging}
                  </div>
                </div>
                <div className="bg-emerald-800 text-white p-2.5 rounded-lg font-bold">
                  <div className="text-emerald-200">Total Buyer Price</div>
                  <div className="text-base">
                    ₹{plan.price_breakdown.total_buyer_price_per_kg}/kg
                  </div>
                </div>
              </div>
            </div>

            {/* Confirm Plan Action */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-200">
              <div>
                <span className="text-xs text-slate-500">Estimated Total Order Value</span>
                <div className="text-2xl font-black text-slate-900">
                  ₹{plan.total_estimated_amount.toLocaleString("en-IN")}
                </div>
              </div>
              <button
                onClick={handleConfirmPlan}
                disabled={confirming}
                className="w-full sm:w-auto px-8 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-base rounded-xl shadow-lg shadow-emerald-800/20 transition flex items-center justify-center gap-2"
              >
                {confirming ? (
                  <span>Generating Order & Digital Lot...</span>
                ) : (
                  <>
                    <span>Confirm Procurement Plan</span>
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMED ORDER SUCCESS SCREEN */}
      {confirmedOrder && (
        <div className="bg-white border-2 border-emerald-600 rounded-3xl p-8 shadow-xl space-y-6 text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
              Procurement Successfully Confirmed
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 mt-1">
              Order #{confirmedOrder.order_code}
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Supply reserved across 3 suppliers. Route assigned to Driver Suresh Gaikwad.
            </p>
          </div>

          {/* Digital Lot Badge */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 max-w-md mx-auto text-left space-y-2">
            <div className="text-xs text-slate-500 font-medium">Digital Lot Passport Code</div>
            <div className="font-mono text-base font-bold text-emerald-800">
              {confirmedOrder.digital_lots?.[0] || "LOT-TOM-NK-2609-00421"}
            </div>
            <div className="text-xs text-slate-600">
              Tamper-evident batch tracking active. Origin: Nashik → Destination: {district}.
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={() => router.push(`/lot/${confirmedOrder.digital_lots?.[0] || "LOT-TOM-NK-2609-00421"}`)}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-emerald-700 text-white font-bold text-sm shadow transition hover:bg-emerald-800 flex items-center justify-center gap-2"
            >
              <span>View Digital Lot & QR Passport</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => router.push("/driver")}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-slate-900 text-white font-bold text-sm shadow transition hover:bg-slate-800 flex items-center justify-center gap-2"
            >
              <span>Inspect Driver Logistics Route</span>
              <Truck className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* EXPLAINABLE "WHY 94%?" MODAL */}
      {selectedSupplierForWhy && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedSupplierForWhy(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-6 h-6" />
            </button>

            <div>
              <div className="text-xs text-emerald-700 font-bold uppercase tracking-wider">
                Explainable Matching Engine
              </div>
              <h3 className="text-2xl font-black text-slate-900 mt-1">
                Why {Math.round(selectedSupplierForWhy.score_percentage)}% Match?
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Supplier: <span className="font-semibold text-slate-800">{selectedSupplierForWhy.supplier_name}</span> ({selectedSupplierForWhy.pickup_location})
              </p>
            </div>

            {/* Subscores breakdown list */}
            <div className="space-y-3">
              {/* Quantity */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>Quantity Match (Weight: 40%)</span>
                  <span>{selectedSupplierForWhy.subscores.quantity_score}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full"
                    style={{ width: `${selectedSupplierForWhy.subscores.quantity_score}%` }}
                  />
                </div>
              </div>

              {/* Distance */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>Distance & Proximity (Weight: 20%)</span>
                  <span>{selectedSupplierForWhy.subscores.distance_score}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full"
                    style={{ width: `${selectedSupplierForWhy.subscores.distance_score}%` }}
                  />
                </div>
              </div>

              {/* Price */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>Price Competitiveness (Weight: 15%)</span>
                  <span>{selectedSupplierForWhy.subscores.price_score}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full"
                    style={{ width: `${selectedSupplierForWhy.subscores.price_score}%` }}
                  />
                </div>
              </div>

              {/* Quality */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>Quality Consistency (Weight: 15%)</span>
                  <span>{selectedSupplierForWhy.subscores.quality_score}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full"
                    style={{ width: `${selectedSupplierForWhy.subscores.quality_score}%` }}
                  />
                </div>
              </div>

              {/* Reliability */}
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-700">
                  <span>Delivery Reliability & Trust (Weight: 10%)</span>
                  <span>{selectedSupplierForWhy.subscores.reliability_score}%</span>
                </div>
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-600 h-full rounded-full"
                    style={{ width: `${selectedSupplierForWhy.subscores.reliability_score}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Qualitative Notes */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-1.5">
              <div className="text-xs font-bold text-slate-800">Verification Factors:</div>
              {selectedSupplierForWhy.subscores.explanation_notes.map((note: string, nIdx: number) => (
                <div key={nIdx} className="text-xs text-slate-600 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span>{note}</span>
                </div>
              ))}
            </div>

            <button
              onClick={() => setSelectedSupplierForWhy(null)}
              className="w-full py-2.5 bg-slate-900 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition"
            >
              Close Explainability Modal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
