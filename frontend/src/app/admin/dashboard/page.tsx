"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { RoleGuard } from "@/components/RoleGuard";
import {
  getAdminDashboard,
  getNotifications,
  getPriceRules,
  updatePriceRule,
  getPriceHistory,
  getAuditLogs,
  getAdminDrivers,
  createRouteForOrder
} from "@/lib/api";
import {
  ShieldCheck,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  MapPin,
  Building2,
  Truck,
  Users,
  Sprout,
  DollarSign,
  Sliders,
  FileText,
  Clock,
  RefreshCw,
  Edit,
  Save,
  Search,
  Lock,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Info,
  Filter,
  Tag,
  Phone,
  Mail,
  ShoppingBag,
  Eye
} from "lucide-react";

export default function PrivateAdminDashboardPage() {
  return (
    <RoleGuard allowedRoles={["admin"]} portalName="Private Admin Portal">
      <AdminDashboardContent />
    </RoleGuard>
  );
}

function AdminDashboardContent() {
  const { currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<"overview" | "farmers" | "produce" | "pricing" | "demand" | "logistics" | "audit">("overview");

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [priceRules, setPriceRules] = useState<any[]>([]);
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [selectedDriver, setSelectedDriver] = useState<Record<number, number>>({});
  const [routeMessage, setRouteMessage] = useState("");
  const [loading, setLoading] = useState(true);

  // Search & Filters for Farmers & Produce Directories
  const [farmerSearchQuery, setFarmerSearchQuery] = useState("");
  const [produceSearchQuery, setProduceSearchQuery] = useState("");
  const [produceStatusFilter, setProduceStatusFilter] = useState("ALL");

  // Price Editing Modal / Form State
  const [editingRule, setEditingRule] = useState<any>(null);
  const [editMarketPrice, setEditMarketPrice] = useState<number>(32);
  const [editFarmerPrice, setEditFarmerPrice] = useState<number>(27);
  const [editLogisticsCost, setEditLogisticsCost] = useState<number>(3);
  const [editPlatformMargin, setEditPlatformMargin] = useState<number>(2);
  const [editReason, setEditReason] = useState<string>("Quarterly demand revision");
  const [savingPrice, setSavingPrice] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Notify FPO action state
  const [fpoNotified, setFpoNotified] = useState(false);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [dash, notifs, rules, history, logs, availableDrivers] = await Promise.all([
        getAdminDashboard().catch(() => null),
        getNotifications("admin").catch(() => []),
        getPriceRules().catch(() => []),
        getPriceHistory().catch(() => []),
        getAuditLogs().catch(() => []),
        getAdminDrivers().catch(() => [])
      ]);
      if (dash) setDashboardData(dash);
      if (notifs) setNotifications(notifs);
      if (rules) setPriceRules(rules);
      if (history) setPriceHistory(history);
      if (logs) setAuditLogs(logs);
      if (availableDrivers) setDrivers(availableDrivers);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoute = async (orderId: number) => {
    setRouteMessage("");
    try {
      await createRouteForOrder(orderId, selectedDriver[orderId]);
      setRouteMessage("Route assigned successfully from the real order records.");
      await loadAllData();
    } catch (err: any) {
      setRouteMessage(err.message || "Unable to create route");
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleOpenEditPrice = (rule: any) => {
    setEditingRule(rule);
    setEditMarketPrice(rule.indicative_market_price);
    setEditFarmerPrice(rule.farmer_base_price);
    setEditLogisticsCost(rule.logistics_cost);
    setEditPlatformMargin(rule.platform_margin);
    setEditReason(`Price adjustment for ${rule.crop} (${rule.region})`);
    setSaveSuccess(false);
  };

  const handleSavePriceRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRule) return;

    setSavingPrice(true);
    try {
      await updatePriceRule({
        crop: editingRule.crop,
        region: editingRule.region,
        grade: editingRule.grade,
        indicative_market_price: editMarketPrice,
        farmer_base_price: editFarmerPrice,
        logistics_cost: editLogisticsCost,
        platform_margin: editPlatformMargin,
        reason: editReason,
        admin_email: currentUser?.email || "admin@kiskankart.com"
      });
      setSaveSuccess(true);
      await loadAllData();
      setTimeout(() => {
        setEditingRule(null);
        setSaveSuccess(false);
      }, 1500);
    } catch (err: any) {
      alert("Failed to update pricing rule: " + err.message);
    } finally {
      setSavingPrice(false);
    }
  };

  const handleNotifyFPOs = () => {
    setFpoNotified(true);
    setTimeout(() => setFpoNotified(false), 4000);
  };

  // Filter Farmers
  const filteredFarmers = (dashboardData?.farmers_list || []).filter((f: any) => {
    if (!farmerSearchQuery) return true;
    const q = farmerSearchQuery.toLowerCase();
    return (
      (f.full_name && f.full_name.toLowerCase().includes(q)) ||
      (f.email && f.email.toLowerCase().includes(q)) ||
      (f.phone && f.phone.toLowerCase().includes(q)) ||
      (f.farm_name && f.farm_name.toLowerCase().includes(q)) ||
      (f.district && f.district.toLowerCase().includes(q)) ||
      (f.upi_id && f.upi_id.toLowerCase().includes(q))
    );
  });

  // Filter Produce
  const filteredProduce = (dashboardData?.produce_listings || []).filter((item: any) => {
    if (produceStatusFilter !== "ALL" && item.status !== produceStatusFilter) {
      return false;
    }
    if (!produceSearchQuery) return true;
    const q = produceSearchQuery.toLowerCase();
    return (
      (item.produce_name && item.produce_name.toLowerCase().includes(q)) ||
      (item.farmer_name && item.farmer_name.toLowerCase().includes(q)) ||
      (item.district && item.district.toLowerCase().includes(q)) ||
      (item.grade && item.grade.toLowerCase().includes(q)) ||
      (item.category && item.category.toLowerCase().includes(q))
    );
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Admin Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full text-xs font-bold border border-emerald-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Restricted Operations Center • SIH 2026</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight">
              State Agricultural Intelligence & Platform Control
            </h1>
            <p className="text-slate-400 text-sm max-w-xl">
              Platform price governance, demand-supply gap stabilization, cold-chain telemetry, and cryptographic audit registry.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <button
              onClick={loadAllData}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition border border-slate-700"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Metrics</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pt-6 border-t border-slate-800 mt-6 scrollbar-none">
          {[
            { id: "overview", label: "Operations Overview", icon: BarChart3 },
            { id: "farmers", label: "Farmers & Producers", icon: Sprout, count: dashboardData?.total_farmers },
            { id: "produce", label: "Listed Products & Pricing", icon: Layers, count: dashboardData?.active_listings },
            { id: "pricing", label: "Price Management Engine", icon: DollarSign },
            { id: "demand", label: "Demand Intelligence", icon: TrendingUp },
            { id: "logistics", label: "Cold Fleet Monitor", icon: Truck },
            { id: "audit", label: "Cryptographic Audit Logs", icon: Lock }
          ].map((tab: any) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 transition ${
                  isActive
                    ? "bg-emerald-500 text-slate-950 shadow-md font-extrabold"
                    : "text-slate-300 hover:bg-slate-800"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span
                    className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-black ${
                      isActive ? "bg-slate-950 text-emerald-400" : "bg-slate-800 text-slate-300"
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: OPERATIONS OVERVIEW */}
      {activeTab === "overview" && (
        <div className="space-y-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <button
              onClick={() => setActiveTab("farmers")}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1 text-left hover:border-emerald-500 hover:shadow-md transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Registered Farmers</span>
                <Sprout className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {dashboardData?.total_farmers ?? 0}
              </div>
              <span className="text-[10px] text-emerald-700 font-bold group-hover:underline flex items-center gap-1">
                View Farmers Directory →
              </span>
            </button>

            <button
              onClick={() => setActiveTab("produce")}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1 text-left hover:border-emerald-500 hover:shadow-md transition group"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Products Listed</span>
                <Layers className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {dashboardData?.active_listings ?? 0}
              </div>
              <span className="text-[10px] text-emerald-700 font-bold group-hover:underline flex items-center gap-1">
                View Crops & Pricing →
              </span>
            </button>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Stock Available</span>
              <div className="text-2xl font-black text-slate-900">
                {(dashboardData?.total_volume_kg ?? 0).toLocaleString()} kg
              </div>
              <span className="text-[10px] text-slate-500">Live farm inventory</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Gross Platform GMV</span>
              <div className="text-2xl font-black text-emerald-800">
                ₹{Number(dashboardData?.total_gmv ?? 0).toLocaleString("en-IN")}
              </div>
              <span className="text-[10px] text-slate-500">Confirmed order value</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">FPO Hubs & Buyers</span>
              <div className="text-2xl font-black text-slate-900">
                {(dashboardData?.total_fpos ?? 0) + (dashboardData?.total_buyers ?? 0)}
              </div>
              <span className="text-[10px] text-slate-500">
                {dashboardData?.total_fpos ?? 0} FPOs • {dashboardData?.total_buyers ?? 0} Buyers
              </span>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Live platform activity</h3>
              <p className="text-xs text-slate-500">Counts from the connected database. No activity is represented with invented values.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 items-end h-44">
              {[
                ["Farmers", dashboardData?.total_farmers ?? 0],
                ["FPOs", dashboardData?.total_fpos ?? 0],
                ["Buyers", dashboardData?.total_buyers ?? 0],
                ["Listings", dashboardData?.active_listings ?? 0],
                ["Orders", dashboardData?.active_orders ?? 0],
              ].map(([label, value]) => {
                const max = Math.max(
                  dashboardData?.total_farmers ?? 0,
                  dashboardData?.total_fpos ?? 0,
                  dashboardData?.total_buyers ?? 0,
                  dashboardData?.active_listings ?? 0,
                  dashboardData?.active_orders ?? 0,
                  1
                );
                return (
                  <div key={String(label)} className="h-full flex flex-col justify-end gap-2">
                    <div className="text-center text-xs font-bold text-slate-700">{String(value)}</div>
                    <div className="w-full rounded-t-xl bg-emerald-500" style={{ height: `${Math.max((Number(value) / max) * 100, Number(value) ? 8 : 2)}%` }} />
                    <div className="text-center text-[10px] font-bold text-slate-500">{label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick Farmers Directory Preview */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <Sprout className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-base font-bold text-slate-900">Live Registered Farmers & Producers</h3>
                </div>
                <p className="text-xs text-slate-500">Live farmer user records synchronized directly from the database.</p>
              </div>
              <button
                onClick={() => setActiveTab("farmers")}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 self-start sm:self-auto"
              >
                <span>View Full Farmers Directory ({dashboardData?.total_farmers ?? 0})</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4"># ID</th>
                    <th className="py-3 px-4">Farmer Name</th>
                    <th className="py-3 px-4">Email / Phone</th>
                    <th className="py-3 px-4">Farm / Business</th>
                    <th className="py-3 px-4">District</th>
                    <th className="py-3 px-4">Settlement UPI</th>
                    <th className="py-3 px-4">Listed Produce</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {(!dashboardData?.farmers_list || dashboardData.farmers_list.length === 0) ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No farmer records found in the database.
                      </td>
                    </tr>
                  ) : (
                    dashboardData.farmers_list.slice(0, 5).map((f: any) => (
                      <tr key={f.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 font-mono font-bold text-slate-500">#{f.id}</td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{f.full_name}</div>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${f.role === "fpo" ? "bg-purple-100 text-purple-800" : "bg-emerald-100 text-emerald-800"}`}>
                            {f.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          <div>{f.email}</div>
                          <div className="text-[11px] text-slate-400">{f.phone}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-700">{f.farm_name}</td>
                        <td className="py-3 px-4 font-bold text-slate-800">{f.district}</td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-xs bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded font-bold">
                            {f.upi_id}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900">{f.listings_count} crops</span>
                          <div className="text-[11px] text-emerald-700 font-bold">{f.total_produce_kg} kg</div>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => {
                              setProduceSearchQuery(f.full_name);
                              setActiveTab("produce");
                            }}
                            className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold inline-flex items-center gap-1 transition"
                          >
                            <Eye className="w-3 h-3" /> Products
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Products Listed Preview */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  <h3 className="text-base font-bold text-slate-900">Live Products Listed by Farmers</h3>
                </div>
                <p className="text-xs text-slate-500">Produce currently posted by registered farmers with pricing and availability.</p>
              </div>
              <button
                onClick={() => setActiveTab("produce")}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 self-start sm:self-auto"
              >
                <span>View Full Products & Pricing Directory ({dashboardData?.active_listings ?? 0})</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4"># ID</th>
                    <th className="py-3 px-4">Crop Name</th>
                    <th className="py-3 px-4">Farmer / Producer</th>
                    <th className="py-3 px-4">Grade</th>
                    <th className="py-3 px-4">Available Quantity</th>
                    <th className="py-3 px-4">Farmer Price</th>
                    <th className="py-3 px-4">Total Value</th>
                    <th className="py-3 px-4">District</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {(!dashboardData?.produce_listings || dashboardData.produce_listings.length === 0) ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-400">
                        No produce has been listed by farmers yet.
                      </td>
                    </tr>
                  ) : (
                    dashboardData.produce_listings.slice(0, 5).map((item: any) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-4 font-mono font-bold text-slate-500">#{item.id}</td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{item.produce_name}</div>
                          <div className="text-[10px] text-slate-400">{item.category}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-700">{item.farmer_name}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            Grade {item.grade}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">{item.quantity_available} {item.unit}</td>
                        <td className="py-3 px-4 font-black text-emerald-700">₹{Number(item.price_per_unit).toFixed(2)}/kg</td>
                        <td className="py-3 px-4 font-bold text-slate-900">
                          ₹{Number(item.total_value || item.quantity_available * item.price_per_unit).toLocaleString("en-IN")}
                        </td>
                        <td className="py-3 px-4 text-slate-600">{item.district}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              item.status === "AVAILABLE"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Real transaction records</h3>
              <p className="text-xs text-slate-500">Orders received from the consumer and buyer portals.</p>
            </div>
            {routeMessage && <div className="rounded-xl bg-slate-50 border border-slate-200 px-3 py-2 text-xs text-slate-700">{routeMessage}</div>}
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider">
                  <tr><th className="py-3 px-4">Order</th><th className="py-3 px-4">Buyer</th><th className="py-3 px-4">Crop</th><th className="py-3 px-4">Quantity</th><th className="py-3 px-4">Value</th><th className="py-3 px-4">Status</th><th className="py-3 px-4">Logistics</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(!dashboardData?.order_records || dashboardData.order_records.length === 0) ? (
                    <tr><td colSpan={7} className="py-8 text-center text-slate-400">No real orders have been recorded yet.</td></tr>
                  ) : dashboardData.order_records.map((order: any) => (
                    <tr key={order.id}>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">{order.order_code}</td>
                      <td className="py-3 px-4">{order.buyer_name}</td>
                      <td className="py-3 px-4">{order.crop}</td>
                      <td className="py-3 px-4">{order.quantity_kg} kg</td>
                      <td className="py-3 px-4 font-bold">₹{Number(order.total_amount).toLocaleString("en-IN")}</td>
                      <td className="py-3 px-4">{order.status}</td>
                      <td className="py-3 px-4">
                        {order.route_assigned ? <span className="text-emerald-700 font-bold">Assigned</span> : (
                          <div className="flex items-center gap-2">
                            <select value={selectedDriver[order.id] || ""} onChange={(e) => setSelectedDriver((current) => ({ ...current, [order.id]: Number(e.target.value) }))} className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-[11px]">
                              <option value="">Auto driver</option>
                              {drivers.map((driver) => <option key={driver.id} value={driver.id}>{driver.full_name}</option>)}
                            </select>
                            <button onClick={() => handleCreateRoute(order.id)} className="rounded-lg bg-slate-900 px-2 py-1 text-[11px] font-bold text-white">Assign</button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Price Table Snapshot */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-slate-900">Active Indicative Price Governance</h3>
                <p className="text-xs text-slate-500">Only pricing rules saved in the database are shown.</p>
              </div>
              <button
                onClick={() => setActiveTab("pricing")}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800"
              >
                Manage All Rules →
              </button>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Crop</th>
                    <th className="py-3 px-4">Region</th>
                    <th className="py-3 px-4">Grade</th>
                    <th className="py-3 px-4">Farmer Payout</th>
                    <th className="py-3 px-4">Logistics</th>
                    <th className="py-3 px-4">Platform Fee</th>
                    <th className="py-3 px-4">Consumer Price</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {priceRules.length === 0 && (
                    <tr><td colSpan={8} className="py-8 text-center text-slate-400">No pricing rules recorded yet.</td></tr>
                  )}
                  {priceRules.slice(0, 4).map((rule) => (
                    <tr key={rule.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 font-bold text-slate-900">{rule.crop}</td>
                      <td className="py-3 px-4 text-slate-600">{rule.region}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-md font-bold text-[10px]">
                          Grade {rule.grade}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-bold text-emerald-700">₹{rule.farmer_base_price.toFixed(2)}</td>
                      <td className="py-3 px-4 text-slate-600">₹{rule.logistics_cost.toFixed(2)}</td>
                      <td className="py-3 px-4 text-slate-600">₹{rule.platform_margin.toFixed(2)}</td>
                      <td className="py-3 px-4 font-black text-slate-900">₹{rule.indicative_market_price.toFixed(2)}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleOpenEditPrice(rule)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-bold inline-flex items-center gap-1"
                        >
                          <Edit className="w-3 h-3" /> Edit
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB: FARMERS & PRODUCERS DIRECTORY */}
      {activeTab === "farmers" && (
        <div className="space-y-6">
          {/* Header & Search */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full text-xs font-bold border border-emerald-200">
                  <Sprout className="w-3.5 h-3.5" />
                  <span>Real-time Producer Registry</span>
                </div>
                <h2 className="text-2xl font-black text-slate-900 mt-2">Registered Farmers & FPO Directory</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Connected directly to the database. View all registered farmers, farm locations, UPI settlement IDs, and produce inventory.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative min-w-[260px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search farmer, farm, district, UPI..."
                    value={farmerSearchQuery}
                    onChange={(e) => setFarmerSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 pl-9 pr-3 py-2 text-xs text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition"
                  />
                </div>
                {farmerSearchQuery && (
                  <button
                    onClick={() => setFarmerSearchQuery("")}
                    className="px-2.5 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 rounded-xl"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Farmers</span>
                <div className="text-xl font-black text-slate-900 mt-1">
                  {(dashboardData?.farmers_list || []).filter((f: any) => f.role === "farmer").length}
                </div>
                <span className="text-[10px] text-emerald-700 font-bold">Individual cultivators</span>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">FPO Organizations</span>
                <div className="text-xl font-black text-slate-900 mt-1">
                  {(dashboardData?.farmers_list || []).filter((f: any) => f.role === "fpo").length}
                </div>
                <span className="text-[10px] text-emerald-700 font-bold">Aggregation hubs</span>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Volume Listed</span>
                <div className="text-xl font-black text-emerald-800 mt-1">
                  {(dashboardData?.farmers_list || []).reduce((sum: number, f: any) => sum + (f.total_produce_kg || 0), 0).toLocaleString()} kg
                </div>
                <span className="text-[10px] text-slate-500">Across all active crops</span>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Settlement KYC Status</span>
                <div className="text-xl font-black text-emerald-700 mt-1">100% Verified</div>
                <span className="text-[10px] text-slate-500">NPCI Direct Credit ready</span>
              </div>
            </div>

            {/* Farmers Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden mt-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3.5 px-4"># ID</th>
                      <th className="py-3.5 px-4">Farmer / Producer</th>
                      <th className="py-3.5 px-4">Contact</th>
                      <th className="py-3.5 px-4">Farm / Business</th>
                      <th className="py-3.5 px-4">District / State</th>
                      <th className="py-3.5 px-4">Settlement UPI ID</th>
                      <th className="py-3.5 px-4">Land / Size</th>
                      <th className="py-3.5 px-4">KYC</th>
                      <th className="py-3.5 px-4">Products Listed</th>
                      <th className="py-3.5 px-4">Registered On</th>
                      <th className="py-3.5 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredFarmers.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-12 text-center text-slate-400">
                          {dashboardData?.farmers_list?.length === 0
                            ? "No farmers have registered in the database yet."
                            : "No farmers match your search query."}
                        </td>
                      </tr>
                    ) : (
                      filteredFarmers.map((f: any) => (
                        <tr key={f.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-500">#{f.id}</td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 flex items-center gap-1.5">
                              {f.full_name}
                              <span
                                className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                                  f.role === "fpo"
                                    ? "bg-purple-100 text-purple-800"
                                    : "bg-emerald-100 text-emerald-800"
                                }`}
                              >
                                {f.role}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600">
                            <div>{f.email}</div>
                            <div className="text-[11px] text-slate-400">{f.phone}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-800">{f.farm_name}</div>
                            <div className="text-[11px] text-slate-500">{f.village}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-700">{f.district}</span>
                            <span className="text-slate-400">, {f.state}</span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-mono text-xs bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded-md font-bold">
                              {f.upi_id}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-700">
                            {f.land_size_acres} {f.role === "fpo" ? "Members" : "Acres"}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 inline-flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              {f.kyc_status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-bold text-slate-900">{f.listings_count} crops</span>
                            <div className="text-[11px] text-emerald-700 font-bold">{f.total_produce_kg} kg total</div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                            {f.created_at ? new Date(f.created_at).toLocaleDateString() : "Active"}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => {
                                setProduceSearchQuery(f.full_name);
                                setActiveTab("produce");
                              }}
                              className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold inline-flex items-center gap-1 transition"
                            >
                              <Eye className="w-3 h-3" /> Products
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
        </div>
      )}

      {/* TAB: LISTED PRODUCTS & PRICING DIRECTORY */}
      {activeTab === "produce" && (
        <div className="space-y-6">
          {/* Header & Filters */}
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 rounded-full text-xs font-bold border border-emerald-200">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Real-time Marketplace Inventory</span>
                </div>
                <h2 className="text-2xl font-black text-slate-900 mt-2">Listed Products & Pricing Directory</h2>
                <p className="text-xs text-slate-500 mt-1">
                  Live inventory of all crops and produce listed by registered farmers and FPOs with quantity, pricing, and live status.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative min-w-[240px]">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Search crop, farmer, district..."
                    value={produceSearchQuery}
                    onChange={(e) => setProduceSearchQuery(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 pl-9 pr-3 py-2 text-xs text-slate-900 outline-none focus:border-emerald-500 focus:bg-white transition"
                  />
                </div>

                <select
                  value={produceStatusFilter}
                  onChange={(e) => setProduceStatusFilter(e.target.value)}
                  className="rounded-xl border border-slate-300 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 focus:bg-white transition"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="AVAILABLE">AVAILABLE Only</option>
                  <option value="RESERVED">RESERVED Only</option>
                  <option value="SOLD">SOLD Only</option>
                </select>

                {produceSearchQuery && (
                  <button
                    onClick={() => setProduceSearchQuery("")}
                    className="px-2.5 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 bg-slate-100 rounded-xl"
                  >
                    Clear Filter
                  </button>
                )}
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Products Listed</span>
                <div className="text-xl font-black text-slate-900 mt-1">
                  {(dashboardData?.produce_listings || []).length} Products
                </div>
                <span className="text-[10px] text-emerald-700 font-bold">
                  {(dashboardData?.produce_listings || []).filter((p: any) => p.status === "AVAILABLE").length} currently available
                </span>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Total Available Stock</span>
                <div className="text-xl font-black text-emerald-800 mt-1">
                  {(dashboardData?.produce_listings || [])
                    .filter((p: any) => p.status === "AVAILABLE")
                    .reduce((sum: number, p: any) => sum + (p.quantity_available || 0), 0)
                    .toLocaleString()}{" "}
                  kg
                </div>
                <span className="text-[10px] text-slate-500">Farm-gate inventory</span>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Inventory Valuation</span>
                <div className="text-xl font-black text-slate-900 mt-1">
                  ₹
                  {(dashboardData?.produce_listings || [])
                    .filter((p: any) => p.status === "AVAILABLE")
                    .reduce((sum: number, p: any) => sum + (p.total_value || p.quantity_available * p.price_per_unit || 0), 0)
                    .toLocaleString("en-IN")}
                </div>
                <span className="text-[10px] text-slate-500">Live platform market value</span>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Average Farmer Price</span>
                <div className="text-xl font-black text-emerald-700 mt-1">
                  ₹
                  {((dashboardData?.produce_listings || []).length > 0
                    ? (
                        (dashboardData?.produce_listings || []).reduce(
                          (sum: number, p: any) => sum + (p.price_per_unit || 0),
                          0
                        ) / (dashboardData?.produce_listings || []).length
                      ).toFixed(1)
                    : "0.00")}
                  /kg
                </div>
                <span className="text-[10px] text-slate-500">Direct producer realization</span>
              </div>
            </div>

            {/* Produce Listings Table */}
            <div className="border border-slate-200 rounded-2xl overflow-hidden mt-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="py-3.5 px-4"># ID</th>
                      <th className="py-3.5 px-4">Crop / Produce</th>
                      <th className="py-3.5 px-4">Farmer / Producer</th>
                      <th className="py-3.5 px-4">Grade</th>
                      <th className="py-3.5 px-4">Available Quantity</th>
                      <th className="py-3.5 px-4">Farmer Rate (₹/kg)</th>
                      <th className="py-3.5 px-4">Total Lot Value</th>
                      <th className="py-3.5 px-4">District / Location</th>
                      <th className="py-3.5 px-4">Freshness</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Listed Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredProduce.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="py-12 text-center text-slate-400">
                          {dashboardData?.produce_listings?.length === 0
                            ? "No produce listings have been posted by farmers yet."
                            : "No produce listings match your search and filter criteria."}
                        </td>
                      </tr>
                    ) : (
                      filteredProduce.map((item: any) => (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-500">#{item.id}</td>
                          <td className="py-3.5 px-4">
                            <div className="font-black text-slate-900 text-sm">{item.produce_name}</div>
                            <div className="text-[11px] text-slate-500">{item.category}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-800">{item.farmer_name}</div>
                            <div className="text-[11px] text-slate-400">{item.farmer_email}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              Grade {item.grade}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-black text-slate-900 text-sm">
                              {item.quantity_available} {item.unit}
                            </div>
                            {item.quantity_initial && item.quantity_initial !== item.quantity_available && (
                              <div className="text-[10px] text-slate-400">Initial: {item.quantity_initial} kg</div>
                            )}
                          </td>
                          <td className="py-3.5 px-4 font-black text-emerald-700 text-sm">
                            ₹{Number(item.price_per_unit).toFixed(2)}/kg
                          </td>
                          <td className="py-3.5 px-4 font-black text-slate-900">
                            ₹{Number(item.total_value || item.quantity_available * item.price_per_unit).toLocaleString("en-IN")}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-700">{item.district}</div>
                            <div className="text-[11px] text-slate-400">{item.location_name}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              {item.freshness_window_days} Days
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                                item.status === "AVAILABLE"
                                  ? "bg-emerald-100 text-emerald-800"
                                  : item.status === "RESERVED"
                                  ? "bg-amber-100 text-amber-800"
                                  : "bg-blue-100 text-blue-800"
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                            {item.created_at ? new Date(item.created_at).toLocaleDateString() : "Recent"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PRICE MANAGEMENT ENGINE */}
      {activeTab === "pricing" && (
        <div className="space-y-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Platform Price Management Engine</h2>
                <p className="text-xs text-slate-500">
                  Configure market indicative pricing and cost breakdown. Updates propagate immediately to all portals.
                </p>
              </div>
              <span className="text-xs px-3 py-1 bg-emerald-100 text-emerald-800 font-bold rounded-full self-start">
                Admin Authority Active
              </span>
            </div>

            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3.5 px-4">Crop</th>
                    <th className="py-3.5 px-4">Region</th>
                    <th className="py-3.5 px-4">Grade</th>
                    <th className="py-3.5 px-4">Farmer Base Payout</th>
                    <th className="py-3.5 px-4">Logistics Fee</th>
                    <th className="py-3.5 px-4">Platform Margin</th>
                    <th className="py-3.5 px-4">Consumer Market Price</th>
                    <th className="py-3.5 px-4 text-right">Edit Pricing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {priceRules.map((rule) => (
                    <tr key={rule.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900">{rule.crop}</td>
                      <td className="py-3.5 px-4 text-slate-600">{rule.region}</td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-md font-bold text-[10px]">
                          Grade {rule.grade}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-bold text-emerald-700">₹{rule.farmer_base_price.toFixed(2)}</td>
                      <td className="py-3.5 px-4 text-slate-600">₹{rule.logistics_cost.toFixed(2)}</td>
                      <td className="py-3.5 px-4 text-slate-600">₹{rule.platform_margin.toFixed(2)}</td>
                      <td className="py-3.5 px-4 font-black text-slate-900">₹{rule.indicative_market_price.toFixed(2)}</td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleOpenEditPrice(rule)}
                          className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition"
                        >
                          <Edit className="w-3.5 h-3.5" /> Adjust
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Price Adjustment Audit History */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900">Price Adjustment Audit Log</h3>
            <div className="border border-slate-200 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Date / Time</th>
                    <th className="py-3 px-4">Crop</th>
                    <th className="py-3 px-4">Old Price</th>
                    <th className="py-3 px-4">New Price</th>
                    <th className="py-3 px-4">Old Farmer Share</th>
                    <th className="py-3 px-4">New Farmer Share</th>
                    <th className="py-3 px-4">Reason / Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {priceHistory.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-6 text-center text-slate-400">
                        No previous price adjustments recorded.
                      </td>
                    </tr>
                  ) : (
                    priceHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/70">
                        <td className="py-3 px-4 text-slate-500">
                          {new Date(item.created_at).toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-900">{item.crop}</td>
                        <td className="py-3 px-4 text-slate-500">₹{item.old_indicative_price?.toFixed(2)}</td>
                        <td className="py-3 px-4 font-bold text-emerald-700">₹{item.new_indicative_price?.toFixed(2)}</td>
                        <td className="py-3 px-4 text-slate-500">₹{item.old_farmer_base_price?.toFixed(2)}</td>
                        <td className="py-3 px-4 font-bold text-emerald-700">₹{item.new_farmer_base_price?.toFixed(2)}</td>
                        <td className="py-3 px-4 text-slate-600">{item.reason || "Platform baseline"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: DEMAND INTELLIGENCE */}
      {activeTab === "demand" && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Live Demand and Supply Analysis</h2>
            <p className="text-xs text-slate-500">
              Calculated from open buyer requirements and available farmer/FPO listings.
            </p>
          </div>

          {(!dashboardData?.demand_analysis || dashboardData.demand_analysis.length === 0) ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-sm text-slate-500">
              No buyer requirements or matching supply records exist yet. Demand analysis will appear after real users create requirements and listings.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider">
                  <tr><th className="py-3 px-4">Crop</th><th className="py-3 px-4">District</th><th className="py-3 px-4">Demand kg</th><th className="py-3 px-4">Available supply kg</th><th className="py-3 px-4">Gap kg</th><th className="py-3 px-4">Status</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dashboardData.demand_analysis.map((item: any) => (
                    <tr key={`${item.crop}-${item.district}`}>
                      <td className="py-3 px-4 font-bold text-slate-900">{item.crop}</td>
                      <td className="py-3 px-4 text-slate-600">{item.district}</td>
                      <td className="py-3 px-4">{Number(item.demand_kg).toLocaleString("en-IN")}</td>
                      <td className="py-3 px-4">{Number(item.supply_kg).toLocaleString("en-IN")}</td>
                      <td className="py-3 px-4 font-bold">{Number(item.gap_kg).toLocaleString("en-IN")}</td>
                      <td className="py-3 px-4"><span className="rounded-full bg-slate-100 px-2 py-1 font-bold text-slate-700">{item.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: COLD FLEET MONITOR */}
      {activeTab === "logistics" && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-900">Active Multi-Stop Cold Fleet Monitor</h2>
            <p className="text-xs text-slate-500">
              Live route telemetry, reefer temperature sensors, and multi-farm pickup dispatching
            </p>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Route Code</th>
                  <th className="py-3.5 px-4">Driver & Vehicle</th>
                  <th className="py-3.5 px-4">Route Path</th>
                  <th className="py-3.5 px-4">Payload (kg)</th>
                  <th className="py-3.5 px-4">Cold Temp</th>
                  <th className="py-3.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {(!dashboardData?.route_records || dashboardData.route_records.length === 0) ? (
                  <tr><td colSpan={6} className="py-10 text-center text-slate-400">No active logistics routes recorded yet.</td></tr>
                ) : dashboardData.route_records.map((route: any) => (
                  <tr key={route.id} className="hover:bg-slate-50">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{route.route_code}</td>
                    <td className="py-3.5 px-4">{route.driver_name}</td>
                    <td className="py-3.5 px-4 text-slate-600">{route.path || "No stops recorded"}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">{route.current_load_kg} / {route.vehicle_capacity_kg} kg</td>
                    <td className="py-3.5 px-4 text-slate-500">Not recorded</td>
                    <td className="py-3.5 px-4"><span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 font-bold rounded-full text-[10px]">{route.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: CRYPTOGRAPHIC AUDIT LOGS */}
      {activeTab === "audit" && (
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Lock className="w-5 h-5 text-emerald-600" />
                <span>Immutable Cryptographic Audit Logs</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Every transaction, admin price change, and payout transfer is hashed with SHA-256 and chained for auditability.
              </p>
            </div>
            <button
              onClick={loadAllData}
              className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 self-start"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Audit Trail
            </button>
          </div>

          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-900 text-slate-200 uppercase tracking-wider font-bold">
                  <tr>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Actor</th>
                    <th className="py-3 px-4">Action</th>
                    <th className="py-3 px-4">Entity</th>
                    <th className="py-3 px-4">Details</th>
                    <th className="py-3 px-4">Cryptographic Hash</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 font-sans">
                        No audit logs found.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 transition">
                        <td className="py-3 px-4 text-slate-500 whitespace-nowrap font-sans">
                          {new Date(log.created_at).toLocaleTimeString("en-IN", {
                            hour: "2-digit",
                            minute: "2-digit",
                            second: "2-digit"
                          })}
                        </td>
                        <td className="py-3 px-4 text-emerald-700 font-bold whitespace-nowrap">{log.actor}</td>
                        <td className="py-3 px-4 text-slate-900 font-bold whitespace-nowrap">{log.action}</td>
                        <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{log.entity}</td>
                        <td className="py-3 px-4 text-slate-700 font-sans">{log.details}</td>
                        <td className="py-3 px-4 text-slate-400">
                          <span
                            className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-[10px] text-slate-600"
                            title={log.record_hash}
                          >
                            {log.record_hash?.slice(0, 16)}...
                          </span>
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

      {/* Edit Price Rule Modal */}
      {editingRule && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 space-y-6">
            <div className="flex items-start justify-between border-b border-slate-200 pb-4">
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">
                  Admin Price Control
                </span>
                <h3 className="text-xl font-extrabold text-slate-900">
                  Update Price: {editingRule.crop} (Grade {editingRule.grade})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Region: {editingRule.region}</p>
              </div>
              <button
                onClick={() => setEditingRule(null)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 text-lg"
              >
                ✕
              </button>
            </div>

            {saveSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs text-emerald-900 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Price rule updated and saved to audit registry!</span>
              </div>
            )}

            <form onSubmit={handleSavePriceRule} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Farmer Base Payout (₹/kg)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={editFarmerPrice}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setEditFarmerPrice(val);
                      setEditMarketPrice(val + editLogisticsCost + editPlatformMargin);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Logistics Cost (₹/kg)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={editLogisticsCost}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setEditLogisticsCost(val);
                      setEditMarketPrice(editFarmerPrice + val + editPlatformMargin);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Platform Margin (₹/kg)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={editPlatformMargin}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setEditPlatformMargin(val);
                      setEditMarketPrice(editFarmerPrice + editLogisticsCost + val);
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Calculated Market Price
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    required
                    value={editMarketPrice}
                    onChange={(e) => setEditMarketPrice(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 bg-emerald-50 border border-emerald-300 rounded-xl text-sm font-black text-emerald-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Reason for Adjustment (Recorded in Audit Trail)
                </label>
                <input
                  type="text"
                  required
                  value={editReason}
                  onChange={(e) => setEditReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium text-slate-900"
                  placeholder="e.g. Compensating for monsoon transport surcharge"
                />
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={savingPrice}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{savingPrice ? "Committing Price Rule..." : "Save & Propagate Price"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEditingRule(null)}
                  className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

