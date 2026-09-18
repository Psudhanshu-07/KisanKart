"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { getDigitalLot } from "@/lib/api";
import {
  ShieldCheck,
  QrCode,
  MapPin,
  Calendar,
  Clock,
  Truck,
  CheckCircle2,
  Circle,
  Building2,
  Sprout,
  ArrowRight
} from "lucide-react";

export default function DigitalLotPassportPage() {
  const params = useParams();
  const lotCode = (params?.id as string) || "LOT-TOM-NK-2609-00421";
  const [lot, setLot] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getDigitalLot(lotCode)
      .then(setLot)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [lotCode]);

  if (loading) {
    return <div className="p-12 text-center text-sm text-slate-500">Loading Produce Passport...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Produce Passport Card */}
      <div className="bg-white border-2 border-emerald-600 rounded-3xl overflow-hidden shadow-lg">
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-green-900 text-white p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center sm:text-left">
            <span className="bg-emerald-700/80 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider text-emerald-200">
              Produce Passport & Traceability
            </span>
            <h1 className="text-2xl sm:text-3xl font-black mt-2 font-mono">
              LOT: {lot?.lot_code || lotCode}
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100">
              Farm-to-Fork Digital Provenance • Tamper-Evident Batch Tracking
            </p>
          </div>

          {/* Scannable QR Code */}
          <div className="bg-white p-3 rounded-2xl shadow-md text-center flex-shrink-0">
            {lot?.qr_code_svg || lot?.qr_code_base64 ? (
              <img
                src={lot.qr_code_svg || lot.qr_code_base64}
                alt={`QR code for ${lotCode}`}
                className="w-32 h-32 mx-auto rounded-lg"
              />
            ) : (
              <div className="w-32 h-32 bg-slate-100 rounded-lg flex items-center justify-center">
                <QrCode className="w-16 h-16 text-emerald-700" />
              </div>
            )}
            <span className="text-[10px] text-slate-500 font-mono mt-1 block">
              Scan for Verification
            </span>
          </div>
        </div>

        <div className="p-6 sm:p-8 space-y-8">
          {/* Key Lot Attributes */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 font-medium">Commodity</span>
              <div className="text-lg font-bold text-slate-900 mt-0.5">
                {lot?.crop || "Tomato"} (Grade {lot?.grade || "A"})
              </div>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 font-medium">Batch Volume</span>
              <div className="text-lg font-bold text-slate-900 mt-0.5">
                {lot?.quantity_kg || 500} kg
              </div>
            </div>
            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
              <span className="text-xs text-slate-500 font-medium">Origin Location</span>
              <div className="text-base font-bold text-slate-900 mt-0.5">
                {lot?.origin_location || "Nashik, Maharashtra"}
              </div>
            </div>
            <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200">
              <span className="text-xs text-emerald-900 font-medium">Current Status</span>
              <div className="text-base font-bold text-emerald-800 mt-0.5">
                {lot?.status || "In Transit"}
              </div>
            </div>
          </div>

          {/* Harvest & Freshness Window */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
            <div className="space-y-1">
              <div className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>Harvest & Perishability Timeline</span>
              </div>
              <div className="text-slate-600">
                Harvested: <strong>15 Sept, 6:30 AM</strong> • Recommended Delivery: <strong>Before 18 Sept, 12:00 PM</strong>
              </div>
            </div>
            <span className="bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full uppercase tracking-wider text-[10px]">
              Freshness Priority: HIGH
            </span>
          </div>

          {/* Farm-to-Fork Provenance Audit Trail */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center justify-between">
              <span>Farm-to-Buyer Audit Trail</span>
              <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                <ShieldCheck className="w-4 h-4" /> Fully Verified
              </span>
            </h3>

            {/* Visual Step-by-Step Chain: Farm -> FPO -> Collection -> Transport -> Buyer */}
            <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-emerald-200">
              {lot?.events?.map((ev: any, idx: number) => (
                <div key={idx} className="relative space-y-1">
                  <div
                    className={`absolute -left-6 sm:-left-8 top-1 w-4 h-4 rounded-full border-2 border-white ${
                      ev.is_completed ? "bg-emerald-600" : "bg-slate-300"
                    }`}
                  />
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                    <h4 className="font-bold text-slate-900 text-sm">{ev.event_name}</h4>
                    <span className="text-[11px] text-slate-400">
                      {new Date(ev.timestamp).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600">
                    Actor: <span className="font-medium text-slate-800">{ev.actor}</span> • Location: {ev.location}
                  </div>
                  {ev.notes && (
                    <div className="text-xs text-slate-500 italic bg-white p-2 rounded-lg border border-slate-100 mt-1">
                      {ev.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Transparent Price Breakdown */}
          <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-amber-950 text-sm flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-700" />
                <span>Transparent Price Breakdown (Demo Pricing)</span>
              </h4>
              <span className="text-xs font-black text-amber-900">Total: ₹32.00/kg</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-center">
              <div className="bg-white p-2.5 rounded-lg border border-amber-200">
                <div className="text-slate-500">Farmer Realisation</div>
                <div className="text-base font-bold text-slate-900 mt-0.5">₹25.00</div>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-amber-200">
                <div className="text-slate-500">Logistics Transport</div>
                <div className="text-base font-bold text-slate-900 mt-0.5">₹4.00</div>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-amber-200">
                <div className="text-slate-500">Platform Service</div>
                <div className="text-base font-bold text-slate-900 mt-0.5">₹2.00</div>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-amber-200">
                <div className="text-slate-500">Quality & Other</div>
                <div className="text-base font-bold text-slate-900 mt-0.5">₹1.00</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

