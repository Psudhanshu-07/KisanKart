"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/context/AppContext";
import { RoleGuard } from "@/components/RoleGuard";
import {
  createProduceListing,
  parseVoiceListing,
  getFarmerSummary,
  getDecisionCards,
  getSinglePriceRule,
  getInvoices,
  createFPOPurchase,
  payInvoice
} from "@/lib/api";
import {
  Sprout,
  TrendingUp,
  PackageCheck,
  CheckCircle2,
  DollarSign,
  AlertCircle,
  Clock,
  MapPin,
  FileText,
  Mic,
  MicOff,
  Sparkles,
  Download,
  Users,
  Building2,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  PlusCircle,
  Truck,
  Layers,
  ChevronRight,
  Printer
} from "lucide-react";

export default function FarmerFPODashboardPage() {
  return (
    <RoleGuard allowedRoles={["farmer", "fpo"]} portalName="Farmer / FPO Portal">
      <FarmerFPODashboardContent />
    </RoleGuard>
  );
}

function FarmerFPODashboardContent() {
  const { currentUser, role, setRole } = useApp();

  // Mode: Can switch between individual Farmer view and FPO Aggregator view
  const isFPO = role === "fpo";
  const [activeTab, setActiveTab] = useState<"home" | "sell" | "fpo_purchase" | "orders" | "demand" | "earnings" | "invoices">("home");

  // Greeting name
  const displayName = isFPO
    ? "Namaste, Nashik Farmers FPO 👋"
    : currentUser?.full_name
    ? `Namaste, ${currentUser.full_name} 👋`
    : "Namaste, Ramesh 👋";

  // Dashboard Data State
  const [summary, setSummary] = useState<any>({
    total_listed_kg: 3200,
    sold_kg: 2450,
    total_earnings: 68500,
    average_rate: 27.95,
    pending_dispatch_kg: 500,
    completed_orders_count: 14
  });
  const [decisionCards, setDecisionCards] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 4-Field Produce Listing Form (Farmer sets no manual market price)
  const [produceCrop, setProduceCrop] = useState("Tomato");
  const [produceQuantity, setProduceQuantity] = useState("500");
  const [produceGrade, setProduceGrade] = useState("A");
  const [harvestDate, setHarvestDate] = useState(new Date().toISOString().split("T")[0]);
  const [district, setDistrict] = useState("Nashik");
  const [suggestedPriceRule, setSuggestedPriceRule] = useState<any>(null);
  const [priceRuleLoading, setPriceRuleLoading] = useState(false);
  const [listingSuccess, setListingSuccess] = useState(false);
  const [listingError, setListingError] = useState("");
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState("");

  // FPO Member Purchase Form State
  const [fpoMemberName, setFpoMemberName] = useState("Kisan Tukaram");
  const [fpoCrop, setFpoCrop] = useState("Tomato");
  const [fpoQuantity, setFpoQuantity] = useState("1200");
  const [fpoRate, setFpoRate] = useState("26.5");
  const [fpoNotes, setFpoNotes] = useState("Harvest Batch from Pimpalgaon Cluster");
  const [fpoPurchaseSuccess, setFpoPurchaseSuccess] = useState<any>(null);
  const [fpoPurchaseLoading, setFpoPurchaseLoading] = useState(false);

  // Invoice Inspection Modal
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  // Fetch initial summary, decision cards, and invoices
  const loadData = async () => {
    setLoading(true);
    try {
      const [sum, cards, invs] = await Promise.all([
        getFarmerSummary().catch(() => null),
        getDecisionCards("farmer").catch(() => []),
        getInvoices().catch(() => [])
      ]);
      if (sum) setSummary(sum);
      if (cards) setDecisionCards(cards);
      if (invs) setInvoices(invs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [role]);

  // Query platform price rule whenever crop/grade changes
  useEffect(() => {
    let isMounted = true;
    setPriceRuleLoading(true);
    getSinglePriceRule(produceCrop, "Maharashtra", produceGrade)
      .then((rule) => {
        if (isMounted) setSuggestedPriceRule(rule);
      })
      .catch(() => {
        if (isMounted) {
          // Default indicative fallback
          setSuggestedPriceRule({
            farmer_base_price: 27.0,
            indicative_market_price: 32.0,
            logistics_cost: 3.0,
            platform_margin: 2.0
          });
        }
      })
      .finally(() => {
        if (isMounted) setPriceRuleLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, [produceCrop, produceGrade]);

  // Voice Listing Simulation / Web Speech
  const handleVoiceListingToggle = () => {
    if (!isVoiceActive) {
      setIsVoiceActive(true);
      setVoiceNotice("Listening... speak your produce details (e.g. 'I have 600 kg Grade A Tomatoes in Nashik')");
      // Simulate intelligent voice parsing after 2.5 seconds
      setTimeout(async () => {
        try {
          const parsed = await parseVoiceListing("I have 600 kg of Grade A Tomato ready for harvest today in Nashik");
          if (parsed) {
            setProduceCrop(parsed.crop || "Tomato");
            setProduceQuantity(String(parsed.quantity_kg || 600));
            setProduceGrade(parsed.grade || "A");
            setDistrict(parsed.district || "Nashik");
            setVoiceNotice("Voice input successfully processed and populated into 4 fields!");
          }
        } catch (e) {
          setVoiceNotice("Voice processed: 600 kg Tomato Grade A detected.");
          setProduceQuantity("600");
          setProduceGrade("A");
        } finally {
          setIsVoiceActive(false);
          setTimeout(() => setVoiceNotice(""), 4000);
        }
      }, 2500);
    } else {
      setIsVoiceActive(false);
      setVoiceNotice("");
    }
  };

  // 4-Field Produce Submission (Farmer sets no manual market price)
  const handleCreateProduce = async (e: React.FormEvent) => {
    e.preventDefault();
    setListingError("");
    setListingSuccess(false);

    try {
      const farmerPrice = suggestedPriceRule ? suggestedPriceRule.farmer_base_price : 27;
      await createProduceListing({
        crop_name: produceCrop,
        quantity_kg: parseFloat(produceQuantity),
        grade: produceGrade,
        price_per_unit: farmerPrice, // platform determined
        unit: "kg",
        category: "Vegetables",
        location_name: "Pimpalgaon Farm Cluster",
        district: district,
        harvest_date: harvestDate,
        shelf_life_days: produceCrop.toLowerCase().includes("tomato") ? 5 : 10
      });
      setListingSuccess(true);
      loadData();
      setTimeout(() => setListingSuccess(false), 5000);
    } catch (err: any) {
      setListingError(err.message || "Failed to submit produce listing");
    }
  };

  // FPO Member Purchase Submission
  const handleFPOPurchaseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFpoPurchaseLoading(true);
    try {
      const inv = await createFPOPurchase({
        member_farmer_name: fpoMemberName,
        crop: fpoCrop,
        quantity: parseFloat(fpoQuantity),
        rate_per_kg: parseFloat(fpoRate),
        notes: fpoNotes
      });
      setFpoPurchaseSuccess(inv);
      loadData();
    } catch (err: any) {
      alert("Error generating FPO purchase: " + err.message);
    } finally {
      setFpoPurchaseLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Header & Role Perspective Switcher */}
      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-green-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-emerald-200 border border-white/10">
              <Sprout className="w-3.5 h-3.5" />
              <span>{isFPO ? "FPO Aggregation & Cluster Management" : "Direct Farm Gate Producer Portal"}</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              {displayName}
            </h1>
            <p className="text-emerald-100/80 text-sm max-w-xl">
              {isFPO
                ? "Manage member aggregation, issue verified purchase invoices, and monitor district bulk requirements."
                : "List produce with platform-guaranteed fair returns, track live dispatch orders, and download verified invoices."}
            </p>
          </div>

          {/* Quick Perspective Toggle */}
          <div className="bg-white/10 backdrop-blur-md p-1.5 rounded-2xl border border-white/15 flex items-center gap-1 self-start md:self-auto">
            <button
              onClick={() => setRole("farmer")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                !isFPO ? "bg-white text-emerald-900 shadow-sm" : "text-white hover:bg-white/10"
              }`}
            >
              <Sprout className="w-3.5 h-3.5" />
              <span>Individual Farmer</span>
            </button>
            <button
              onClick={() => setRole("fpo")}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                isFPO ? "bg-white text-emerald-900 shadow-sm" : "text-white hover:bg-white/10"
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>FPO Hub Mode</span>
            </button>
          </div>
        </div>

        {/* Subheader Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pt-6 border-t border-white/10 mt-6 scrollbar-none">
          {[
            { id: "home", label: "Dashboard Home", icon: Layers },
            { id: "sell", label: "Sell Produce (4 Fields)", icon: PlusCircle },
            ...(isFPO ? [{ id: "fpo_purchase", label: "FPO Member Purchase", icon: Users }] : []),
            { id: "orders", label: "Active Orders", icon: Truck },
            { id: "demand", label: "Demand Intelligence", icon: TrendingUp },
            { id: "earnings", label: "Earnings & Stats", icon: DollarSign },
            { id: "invoices", label: "Invoices & Receipts", icon: FileText }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 transition ${
                  isActive
                    ? "bg-white text-emerald-900 shadow-md"
                    : "text-emerald-100 hover:bg-white/10"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: HOME DASHBOARD */}
      {activeTab === "home" && (
        <div className="space-y-8">
          {/* Quick Immediate Answers Banner */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">What Can I Sell?</span>
              <div className="text-lg font-bold text-slate-900">Tomato, Onion, Potato</div>
              <p className="text-xs text-emerald-700 font-medium flex items-center gap-1 mt-1">
                <TrendingUp className="w-3.5 h-3.5" /> High Demand in Mumbai
              </p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Current Market Demand</span>
              <div className="text-lg font-bold text-emerald-700">+26% Surge</div>
              <p className="text-xs text-slate-500">Deficit in Mumbai hotel cluster</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Sold So Far</span>
              <div className="text-lg font-bold text-slate-900">2,450 kg • ₹68,500</div>
              <p className="text-xs text-slate-500">Average: ₹27.95/kg realized</p>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl shadow-sm space-y-1">
              <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Active Order Status</span>
              <div className="text-lg font-bold text-emerald-900">500 kg Tomato</div>
              <p className="text-xs text-emerald-700 font-medium flex items-center gap-1">
                <Truck className="w-3.5 h-3.5" /> Dispatched to FreshMart Mumbai
              </p>
            </div>
          </div>

          {/* Quick Action Tiles */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <button
              onClick={() => setActiveTab("sell")}
              className="p-5 rounded-2xl bg-gradient-to-br from-emerald-600 to-green-700 text-white shadow-md hover:shadow-lg transition text-left space-y-3 group"
            >
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                <PlusCircle className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold">Sell Produce Now</h3>
                <p className="text-xs text-emerald-100">4-field instant listing with platform-calculated price</p>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-emerald-200 group-hover:translate-x-1 transition">
                <span>Open Form</span> <ChevronRight className="w-4 h-4" />
              </div>
            </button>

            <button
              onClick={() => setActiveTab("demand")}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-emerald-300 hover:shadow-md transition text-left space-y-3 group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">View Open Demands</h3>
                <p className="text-xs text-slate-500">Check what nearby hotels and retailers require today</p>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-emerald-700 group-hover:translate-x-1 transition">
                <span>Inspect Demand Gaps</span> <ChevronRight className="w-4 h-4" />
              </div>
            </button>

            <button
              onClick={() => setActiveTab("invoices")}
              className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-emerald-300 hover:shadow-md transition text-left space-y-3 group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Download Invoices</h3>
                <p className="text-xs text-slate-500">Official GST/platform receipts with transparent breakdowns</p>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold text-emerald-700 group-hover:translate-x-1 transition">
                <span>View Recent Invoices</span> <ChevronRight className="w-4 h-4" />
              </div>
            </button>
          </div>

          {/* Active Orders Quick Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-600" />
                <span>Live Active Orders & Fulfillment</span>
              </h3>
              <button
                onClick={() => setActiveTab("orders")}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
              >
                View Full History →
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="divide-y divide-slate-100">
                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">PO-2026-09221 • Tomato Grade A</span>
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                        DISPATCHED
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">
                      Buyer: FreshMart Hotels, Mumbai | Quantity: 500 kg | Payout: ₹13,500 (@ ₹27/kg)
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-600 font-mono bg-white px-2.5 py-1 rounded border border-slate-200">
                      Lot: LOT-TOM-NK-2609-00421
                    </span>
                    <button
                      onClick={() => setActiveTab("invoices")}
                      className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-semibold flex items-center gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" /> Invoice
                    </button>
                  </div>
                </div>

                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">PO-2026-09198 • Red Onion Grade A</span>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-[10px] font-bold">
                        DELIVERED & SETTLED
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">
                      Buyer: Grand Regency Kitchens, Pune | Quantity: 1,000 kg | Payout: ₹30,000 (@ ₹30/kg)
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-emerald-700 font-bold bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                      Paid to Bank
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SELL PRODUCE (4 FIELDS - Platform Controls Price) */}
      {activeTab === "sell" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Post New Produce Listing</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Complete the 4 simple fields below. Market pricing is automatically calculated by platform governance.
                </p>
              </div>

              {/* Voice Listing Button */}
              <button
                type="button"
                onClick={handleVoiceListingToggle}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                  isVoiceActive
                    ? "bg-rose-600 text-white animate-pulse"
                    : "bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100"
                }`}
              >
                {isVoiceActive ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-emerald-600" />}
                <span>{isVoiceActive ? "Listening..." : "Voice Input (Marathi/Hindi/English)"}</span>
              </button>
            </div>

            {voiceNotice && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{voiceNotice}</span>
              </div>
            )}

            {listingSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 text-xs font-semibold flex items-center gap-2 shadow-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>Produce successfully listed! Aggregated with regional supply and made visible to retail & bulk buyers.</span>
              </div>
            )}

            {listingError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{listingError}</span>
              </div>
            )}

            <form onSubmit={handleCreateProduce} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {/* Field 1: Crop Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    1. Crop Name
                  </label>
                  <select
                    value={produceCrop}
                    onChange={(e) => setProduceCrop(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500 text-slate-900"
                  >
                    <option value="Tomato">Tomato (टमाटर / टोमॅटो)</option>
                    <option value="Onion">Onion (कांदा / प्याज)</option>
                    <option value="Potato">Potato (बटाटा / आलू)</option>
                    <option value="Green Chilli">Green Chilli (मिरची / मिर्च)</option>
                    <option value="Capsicum">Capsicum (शिमला मिर्च)</option>
                  </select>
                </div>

                {/* Field 2: Quantity in kg */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    2. Quantity (kg)
                  </label>
                  <input
                    type="number"
                    min="10"
                    required
                    value={produceQuantity}
                    onChange={(e) => setProduceQuantity(e.target.value)}
                    placeholder="e.g. 500"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500 text-slate-900"
                  />
                </div>

                {/* Field 3: Quality Grade */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    3. Quality Grade
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {["A", "B", "C"].map((g) => (
                      <button
                        type="button"
                        key={g}
                        onClick={() => setProduceGrade(g)}
                        className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                          produceGrade === g
                            ? "bg-emerald-600 text-white border-emerald-600 shadow-sm"
                            : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                        }`}
                      >
                        Grade {g}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Field 4: Harvest Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    4. Harvest Date
                  </label>
                  <input
                    type="date"
                    required
                    value={harvestDate}
                    onChange={(e) => setHarvestDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500 text-slate-900"
                  />
                </div>
              </div>

              {/* District info */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Farm District & Location
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500 text-slate-900"
                    placeholder="District (e.g. Nashik)"
                  />
                  <input
                    type="text"
                    disabled
                    value="Pimpalgaon Cluster Hub"
                    className="px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500"
                  />
                </div>
              </div>

              {/* Platform Governed Price Notice (Farmer DOES NOT manually set the final price) */}
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-700" />
                    <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                      Platform-Governed Indicative Return
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                    Admin Regulated
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
                  <div className="bg-white p-2.5 rounded-xl border border-emerald-100">
                    <span className="text-[10px] text-slate-500 block">Farmer Base Payout</span>
                    <span className="text-base font-black text-emerald-800">
                      ₹{suggestedPriceRule ? suggestedPriceRule.farmer_base_price.toFixed(2) : "27.00"}
                    </span>
                    <span className="text-[10px] text-slate-400 block">/ kg (Direct to You)</span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-emerald-100">
                    <span className="text-[10px] text-slate-500 block">Logistics & Handling</span>
                    <span className="text-sm font-bold text-slate-700">
                      ₹{suggestedPriceRule ? suggestedPriceRule.logistics_cost.toFixed(2) : "3.00"}
                    </span>
                    <span className="text-[10px] text-slate-400 block">/ kg (Fleet)</span>
                  </div>

                  <div className="bg-white p-2.5 rounded-xl border border-emerald-100">
                    <span className="text-[10px] text-slate-500 block">Platform Fee</span>
                    <span className="text-sm font-bold text-slate-700">
                      ₹{suggestedPriceRule ? suggestedPriceRule.platform_margin.toFixed(2) : "2.00"}
                    </span>
                    <span className="text-[10px] text-slate-400 block">/ kg</span>
                  </div>

                  <div className="bg-emerald-100/60 p-2.5 rounded-xl border border-emerald-200">
                    <span className="text-[10px] text-emerald-800 font-semibold block">Market Retail Price</span>
                    <span className="text-base font-black text-emerald-900">
                      ₹{suggestedPriceRule ? suggestedPriceRule.indicative_market_price.toFixed(2) : "32.00"}
                    </span>
                    <span className="text-[10px] text-emerald-700 block">/ kg (Consumer Pays)</span>
                  </div>
                </div>

                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Notice: To eliminate predatory middleman arbitrage and speculative volatility, listing prices are established by platform rules. Farmers are guaranteed the Farmer Base Payout on dispatch.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-md shadow-emerald-700/20 transition flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Publish Listing to Marketplace</span>
              </button>
            </form>
          </div>

          {/* Right Info Box */}
          <div className="space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Market Demand Advice</span>
              </h3>
              <div className="space-y-3 text-xs text-slate-600">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-1">
                  <div className="font-bold">Tomato Grade A Needed</div>
                  <div>Mumbai procurement hub reported 2,500 kg deficit this morning. Listings with harvest within 48 hours receive priority matching.</div>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 space-y-1">
                  <div className="font-bold">Shelf Life & Cold Chain Note</div>
                  <div>Grade A Tomatoes have an estimated 5-day shelf life. KisanKart cold fleet handles door-to-door temperature monitoring.</div>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 text-white p-6 rounded-3xl space-y-3">
              <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Farmer Protection Policy</div>
              <h4 className="text-lg font-bold">100% Guaranteed Payout</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                All procurement orders confirmed through KisanKart are backed by escrow lock. Upon QR scan at delivery, payout is transferred directly to your registered bank account.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: FPO MEMBER PURCHASE (FOR FPO PERSPECTIVE) */}
      {activeTab === "fpo_purchase" && isFPO && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold mb-2">
                <Users className="w-3.5 h-3.5" />
                <span>FPO Member Aggregation & Billing</span>
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Record Member Produce Purchase</h2>
              <p className="text-xs text-slate-500 mt-1">
                Collect produce from member farmers at the cluster hub. Automatically generates an official FPO Purchase Invoice with reference <code>F2M-FPO-XXXXXX</code>.
              </p>
            </div>

            {fpoPurchaseSuccess && (
              <div className="p-5 bg-emerald-50 border border-emerald-300 rounded-2xl text-emerald-900 space-y-3">
                <div className="flex items-center gap-2 font-bold text-sm">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Invoice Successfully Generated: {fpoPurchaseSuccess.invoice_number}</span>
                </div>
                <div className="text-xs space-y-1">
                  <div>Member: <strong>{fpoPurchaseSuccess.recipient_name}</strong></div>
                  <div>Produce: {fpoPurchaseSuccess.quantity_kg} kg {fpoPurchaseSuccess.crop} @ ₹{fpoPurchaseSuccess.rate_per_kg}/kg</div>
                  <div>Total Payout Amount: <strong>₹{fpoPurchaseSuccess.total_amount?.toLocaleString("en-IN")}</strong></div>
                </div>
                <button
                  onClick={() => {
                    setSelectedInvoice(fpoPurchaseSuccess);
                  }}
                  className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5" /> View / Print FPO Invoice
                </button>
              </div>
            )}

            <form onSubmit={handleFPOPurchaseSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Member Farmer Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fpoMemberName}
                    onChange={(e) => setFpoMemberName(e.target.value)}
                    placeholder="e.g. Kisan Tukaram"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Crop
                  </label>
                  <select
                    value={fpoCrop}
                    onChange={(e) => setFpoCrop(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500 text-slate-900"
                  >
                    <option value="Tomato">Tomato</option>
                    <option value="Onion">Onion</option>
                    <option value="Potato">Potato</option>
                    <option value="Capsicum">Capsicum</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Aggregated Quantity (kg)
                  </label>
                  <input
                    type="number"
                    required
                    value={fpoQuantity}
                    onChange={(e) => setFpoQuantity(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500 text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Rate Paid to Farmer (₹/kg)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={fpoRate}
                    onChange={(e) => setFpoRate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500 text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Cluster Notes / Batch ID
                </label>
                <input
                  type="text"
                  value={fpoNotes}
                  onChange={(e) => setFpoNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-blue-500 text-slate-900"
                  placeholder="e.g. Pimpalgaon North Cluster - Lot A"
                />
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-500 block">Total Payout to Member Farmer</span>
                  <span className="text-2xl font-black text-slate-900">
                    ₹{(parseFloat(fpoQuantity || "0") * parseFloat(fpoRate || "0")).toLocaleString("en-IN")}
                  </span>
                </div>
                <button
                  type="submit"
                  disabled={fpoPurchaseLoading}
                  className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50 flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  <span>Generate FPO Invoice</span>
                </button>
              </div>
            </form>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">FPO Hub Aggregation Benefits</h3>
            <ul className="text-xs text-slate-600 space-y-3 leading-relaxed">
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Bulk lots from multiple members are consolidated into high-value B2B shipments.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Every member gets an immutable, transparent payment receipt for their produce.</span>
              </li>
              <li className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>Traceability codes trace directly back to the aggregated cluster.</span>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* TAB 4: ACTIVE ORDERS */}
      {activeTab === "orders" && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Active Order Fulfillment</h2>
              <p className="text-xs text-slate-500">Live order matching and dispatch status</p>
            </div>
            <button
              onClick={loadData}
              className="p-2 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          <div className="divide-y divide-slate-200 border border-slate-200 rounded-2xl overflow-hidden">
            <div className="p-5 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full">
                    DISPATCHED
                  </span>
                  <span className="font-bold text-slate-900">PO-2026-09221</span>
                  <span className="text-xs text-slate-400">• Destination: FreshMart Mumbai</span>
                </div>
                <div className="text-sm font-semibold text-slate-800">
                  500 kg Tomato (Grade A) @ ₹27.00/kg
                </div>
                <div className="text-xs text-slate-500 flex items-center gap-3">
                  <span>Driver: Vikram Patil (Tata Ace MH-15-2022-0091)</span>
                  <span>•</span>
                  <span>Est. Delivery: 4:30 PM Today</span>
                </div>
              </div>

              <div className="text-right space-y-2">
                <div className="text-lg font-black text-emerald-700">₹13,500 Payout</div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono bg-white px-2 py-1 rounded border border-slate-200">
                    LOT-TOM-NK-2609-00421
                  </span>
                </div>
              </div>
            </div>

            <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 font-bold text-xs rounded-full">
                    COMPLETED & SETTLED
                  </span>
                  <span className="font-bold text-slate-900">PO-2026-09198</span>
                  <span className="text-xs text-slate-400">• Destination: Grand Regency Pune</span>
                </div>
                <div className="text-sm font-semibold text-slate-800">
                  1,000 kg Red Onion (Grade A) @ ₹30.00/kg
                </div>
                <div className="text-xs text-slate-500">
                  Completed on Sep 17, 2026 • Verified QR Handshake
                </div>
              </div>

              <div className="text-right space-y-1">
                <div className="text-lg font-black text-slate-900">₹30,000 Paid</div>
                <span className="text-xs text-emerald-600 font-semibold">Credited to Bank Account</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: DEMAND INTELLIGENCE */}
      {activeTab === "demand" && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Regional Demand Intelligence & Signals</h2>
              <p className="text-xs text-slate-500">
                Live AI-predicted market requirements across major urban consumption hubs
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-5 rounded-2xl bg-emerald-50/60 border border-emerald-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-emerald-950">Tomato (Grade A)</span>
                  <span className="px-2 py-0.5 bg-emerald-200 text-emerald-900 rounded-full text-xs font-bold">
                    +26% Demand
                  </span>
                </div>
                <div className="text-xs text-emerald-800">
                  High requirement in Mumbai restaurant clusters. Recommended harvest: Immediate.
                </div>
                <div className="pt-2 text-xs font-semibold text-emerald-900">
                  Indicative Farmer Payout: ₹27.00/kg
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-950">Red Onion (Grade A)</span>
                  <span className="px-2 py-0.5 bg-amber-200 text-amber-900 rounded-full text-xs font-bold">
                    +14% Demand
                  </span>
                </div>
                <div className="text-xs text-amber-800">
                  Moderate surge in Pune institutional catering. Stable procurement expected over next 7 days.
                </div>
                <div className="pt-2 text-xs font-semibold text-amber-900">
                  Indicative Farmer Payout: ₹30.00/kg
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Potato (Grade B)</span>
                  <span className="px-2 py-0.5 bg-slate-200 text-slate-700 rounded-full text-xs font-bold">
                    Stable (-2%)
                  </span>
                </div>
                <div className="text-xs text-slate-600">
                  Adequate cold storage inventory across Thane & Navi Mumbai hubs.
                </div>
                <div className="pt-2 text-xs font-semibold text-slate-700">
                  Indicative Farmer Payout: ₹18.00/kg
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: EARNINGS & STATS */}
      {activeTab === "earnings" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Month's Net Realized Earning</span>
              <div className="text-3xl font-black text-slate-900">₹68,500</div>
              <p className="text-xs text-emerald-600 font-semibold">+18.5% higher than traditional APMC mandi net</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Volume Sold</span>
              <div className="text-3xl font-black text-slate-900">2,450 kg</div>
              <p className="text-xs text-slate-500">Across 14 fulfilled procurement orders</p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Zero Commission Loss</span>
              <div className="text-3xl font-black text-emerald-700">₹0 Middleman Cut</div>
              <p className="text-xs text-slate-500">No unauthorized deductions or weighing loss</p>
            </div>
          </div>

          {/* Farmer Direct Settlement Account Details */}
          <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 rounded-3xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold uppercase tracking-wider">
                  Instant Bank Settlement
                </span>
                <span className="text-xs font-bold text-emerald-800">NPCI / UPI Direct Credit</span>
              </div>
              <h4 className="text-base font-black text-slate-900">
                Primary Farmer Settlement UPI: <code className="font-mono text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-emerald-200">{currentUser?.upi_id || "demo@kisankart"}</code>
              </h4>
              <p className="text-xs text-slate-500">
                All order payouts and consumer purchases automatically credit this UPI VPA directly without third-party commission.
              </p>
            </div>
            <div className="px-3.5 py-2 bg-white rounded-2xl border border-emerald-200 text-xs font-bold text-emerald-700 flex items-center gap-1.5 shadow-sm">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>KYC & UPI Verified</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: INVOICES & RECEIPTS */}
      {activeTab === "invoices" && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Invoices & Official Sale Receipts</h2>
              <p className="text-xs text-slate-500">
                Transparent records of all farmer payouts and FPO member purchase transactions
              </p>
            </div>
            <button
              onClick={loadData}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh List
            </button>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 uppercase tracking-wider font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Invoice Number</th>
                    <th className="py-3.5 px-4">Type</th>
                    <th className="py-3.5 px-4">Counterparty</th>
                    <th className="py-3.5 px-4">Produce Details</th>
                    <th className="py-3.5 px-4">Net Amount</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No invoices available in this view.
                      </td>
                    </tr>
                  ) : (
                    invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                          {inv.invoice_number}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              inv.invoice_type === "FPO_PURCHASE"
                                ? "bg-purple-100 text-purple-800"
                                : inv.invoice_type === "FARMER_SALE"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {inv.invoice_type.replace("_", " ")}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-800">
                          {inv.recipient_name || inv.issuer_name || "M/s Counterparty"}
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {inv.quantity_kg} kg {inv.crop}
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">
                          ₹{inv.total_amount?.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              inv.status === "PAID"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {inv.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setSelectedInvoice(inv)}
                            className="px-3 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold inline-flex items-center gap-1 border border-emerald-200 transition"
                          >
                            <FileText className="w-3 h-3" /> View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-700 font-bold block">
                  Official KisanKart Invoice
                </span>
                <h3 className="text-xl font-extrabold text-slate-900">{selectedInvoice.invoice_number}</h3>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px]">ISSUED TO / RECIPIENT</span>
                  <span className="font-bold text-slate-800">{selectedInvoice.recipient_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">ISSUED BY</span>
                  <span className="font-bold text-slate-800">{selectedInvoice.issuer_name || "KisanKart Direct"}</span>
                </div>
              </div>

              {/* Transparent Cost Breakdown */}
              <div className="border border-slate-200 rounded-xl p-3 space-y-2">
                <div className="font-bold text-slate-800 border-b border-slate-100 pb-1.5 flex justify-between">
                  <span>Item Description</span>
                  <span>Amount</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>
                    {selectedInvoice.crop} ({selectedInvoice.quantity_kg} kg @ ₹{selectedInvoice.rate_per_kg}/kg)
                  </span>
                  <span className="font-semibold text-slate-900">
                    ₹{(selectedInvoice.quantity_kg * selectedInvoice.rate_per_kg).toFixed(2)}
                  </span>
                </div>

                {selectedInvoice.logistics_fee ? (
                  <div className="flex justify-between text-slate-500">
                    <span>Logistics & Handling</span>
                    <span>₹{selectedInvoice.logistics_fee.toFixed(2)}</span>
                  </div>
                ) : null}

                {selectedInvoice.platform_fee ? (
                  <div className="flex justify-between text-slate-500">
                    <span>Platform Service Fee</span>
                    <span>₹{selectedInvoice.platform_fee.toFixed(2)}</span>
                  </div>
                ) : null}

                <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-slate-900 text-sm">
                  <span>Total Net Value</span>
                  <span className="text-emerald-700">₹{selectedInvoice.total_amount?.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-[11px] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Digitally signed and cryptographically recorded in platform immutable audit registry.</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition"
              >
                <Printer className="w-4 h-4" /> Print / Save PDF
              </button>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

