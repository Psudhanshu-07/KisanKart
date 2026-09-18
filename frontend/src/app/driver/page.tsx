"use client";

import React, { useEffect, useState } from "react";
import { useApp } from "@/context/AppContext";
import { getActiveRoute, startRoute, reportDelay } from "@/lib/api";
import {
  Truck,
  MapPin,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  Check,
  Phone,
  ArrowRight,
  ShieldCheck
} from "lucide-react";

export default function DriverPortalPage() {
  const { t } = useApp();
  const [route, setRoute] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [reportingDelay, setReportingDelay] = useState(false);
  const [delayNotice, setDelayNotice] = useState("");

  useEffect(() => {
    loadRoute();
  }, []);

  const loadRoute = async () => {
    setLoading(true);
    try {
      const data = await getActiveRoute();
      setRoute(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleStartRoute = async () => {
    if (!route) return;
    setStarting(true);
    try {
      await startRoute(route.id);
      await loadRoute();
    } catch (e) {
      console.error(e);
    } finally {
      setStarting(false);
    }
  };

  const handleReportDelay = async () => {
    if (!route) return;
    setReportingDelay(true);
    try {
      const res = await reportDelay(route.id, 18, "Kasara Ghat heavy corridor congestion");
      setDelayNotice(res.alert || "⚠ Delivery may be delayed by 18 minutes. New ETA: 11:48 AM");
      await loadRoute();
    } catch (e) {
      console.error(e);
    } finally {
      setReportingDelay(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-sm text-slate-500">Loading driver route...</div>;
  }

  const capacity = route?.vehicle_capacity_kg || 1000.0;
  const currentLoad = route?.current_load_kg || 700.0;
  const loadPercentage = Math.round((currentLoad / capacity) * 100);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6">
      {/* Top Banner with PRIMARY ACTION */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-lg space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Truck className="w-6 h-6 text-emerald-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
              Tata Ace (1.2 Ton) • MH 15 EF 9021
            </span>
          </div>
          <span className="bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 text-xs px-2.5 py-1 rounded-full font-bold">
            {route?.status || "IN_PROGRESS"}
          </span>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-black">
            Today&apos;s Route: {route?.route_code || "RT-MH-2609-01"}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Corridor: Nashik Agri Belt → Thane → Navi Mumbai APMC Hub (184 km)
          </p>
        </div>

        {/* Big PRIMARY CTA: START ROUTE */}
        <button
          onClick={handleStartRoute}
          disabled={starting || route?.status === "IN_PROGRESS"}
          className={`w-full py-4 rounded-2xl text-lg font-black tracking-wide shadow-lg transition flex items-center justify-center gap-2 ${
            route?.status === "IN_PROGRESS"
              ? "bg-emerald-800 text-emerald-200 cursor-default"
              : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 active:scale-95"
          }`}
        >
          <Play className="w-5 h-5 fill-current" />
          <span>{route?.status === "IN_PROGRESS" ? "ROUTE ACTIVE & TRACKING" : "START ROUTE"}</span>
        </button>
      </div>

      {/* Delay Alert Banner */}
      {(delayNotice || route?.status === "DELAYED") && (
        <div className="bg-amber-50 border-2 border-amber-400 text-amber-950 p-4 rounded-2xl shadow-sm space-y-1">
          <div className="flex items-center gap-2 font-bold text-sm">
            <AlertTriangle className="w-5 h-5 text-amber-600" />
            <span>Delivery Delay Broadcasted</span>
          </div>
          <p className="text-xs text-amber-900 font-medium">
            {delayNotice || `⚠ Delivery may be delayed by 18 minutes (Kasara Ghat corridor). New ETA: ${route?.eta_text || "11:48 AM"}`}
          </p>
        </div>
      )}

      {/* Vehicle Capacity Meter */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Vehicle Capacity Meter
          </h3>
          <span className="text-xs font-bold text-slate-500">
            {currentLoad} / {capacity} kg ({loadPercentage}%)
          </span>
        </div>

        <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden p-0.5 border border-slate-200">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              loadPercentage >= 95 ? "bg-amber-500" : "bg-emerald-600"
            }`}
            style={{ width: `${Math.min(loadPercentage, 100)}%` }}
          />
        </div>

        <div className="grid grid-cols-2 gap-4 text-xs pt-1">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-slate-500 block">Current Cargo Load</span>
            <span className="text-base font-bold text-slate-900">{currentLoad} kg</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
            <span className="text-slate-500 block">Available Payload</span>
            <span className="text-base font-bold text-emerald-700">{capacity - currentLoad} kg</span>
          </div>
        </div>

        <div className="bg-amber-50/70 border border-amber-200 p-3 rounded-xl text-xs text-amber-900 flex items-center justify-between">
          <span>Next Pickup: <strong>Farmer C (300 kg)</strong></span>
          <span className="font-bold text-amber-950">Vehicle will be full after this pickup.</span>
        </div>
      </div>

      {/* Scheduled Route Stops */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Optimised Pickup & Delivery Sequence
          </h3>
          <span className="text-xs text-slate-500 font-medium">ETA: {route?.eta_text}</span>
        </div>

        <div className="space-y-3">
          {route?.stops?.map((stop: any) => (
            <div
              key={stop.id}
              className={`p-4 rounded-xl border transition flex items-start justify-between gap-3 ${
                stop.status === "COMPLETED"
                  ? "bg-slate-50 border-slate-200 opacity-75"
                  : "bg-emerald-50/40 border-emerald-300 shadow-sm"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                    stop.status === "COMPLETED"
                      ? "bg-emerald-600 text-white"
                      : "bg-slate-900 text-white"
                  }`}
                >
                  {stop.status === "COMPLETED" ? <Check className="w-4 h-4" /> : stop.stop_sequence}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                      {stop.stop_type}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">{stop.location_name}</h4>
                  </div>
                  <div className="text-xs text-slate-600 mt-1 flex flex-wrap items-center gap-3">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      {stop.scheduled_time}
                    </span>
                    <span>•</span>
                    <span>{stop.quantity_kg} kg</span>
                    <span>•</span>
                    <span className="text-slate-700 font-medium">{stop.contact_name}</span>
                  </div>
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    stop.status === "COMPLETED"
                      ? "bg-slate-200 text-slate-700"
                      : "bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {stop.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Driver Actions: Report Delay */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Corridor Exception Reporting
          </h4>
          <p className="text-xs text-slate-600 mt-0.5">
            Experiencing highway delays? Broadcast dynamic updates to all affected buyers.
          </p>
        </div>
        <button
          onClick={handleReportDelay}
          disabled={reportingDelay}
          className="w-full sm:w-auto px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-sm transition whitespace-nowrap"
        >
          {reportingDelay ? "Recalculating..." : "Report 18-Min Traffic Delay"}
        </button>
      </div>
    </div>
  );
}

