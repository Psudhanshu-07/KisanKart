"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { getInvoices } from "@/lib/api";
import {
  FileText,
  ShoppingBag,
  Printer,
  ShieldCheck,
  Truck,
  CheckCircle2,
  Clock,
  ArrowRight,
  RefreshCw
} from "lucide-react";

export default function ConsumerOrdersPage() {
  const { currentUser } = useApp();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await getInvoices();
      // Filter for consumer purchases or show all
      const consumerInvoices = data.filter(
        (inv: any) => inv.invoice_type === "CONSUMER_PURCHASE" || inv.invoice_number.startsWith("F2M-ORD")
      );
      setInvoices(consumerInvoices.length > 0 ? consumerInvoices : data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <FileText className="w-7 h-7 text-emerald-600" />
            <span>My Orders & Official Invoices</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Track fulfillment progress and download cryptographically stamped purchase invoices
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/shop"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Browse Shop</span>
          </Link>
          <button
            onClick={loadOrders}
            className="p-2 text-slate-500 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition"
            title="Refresh Orders"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-sm text-slate-500">Loading order history...</div>
      ) : invoices.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <FileText className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No orders placed yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            When you purchase farm produce, your verified invoices and digital lot passports will appear here.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition"
          >
            <span>Explore Farm Fresh Produce</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
            {invoices.map((inv) => (
              <div key={inv.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-slate-900 text-sm">
                      {inv.invoice_number}
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-[10px] font-bold">
                      {inv.status || "CONFIRMED"}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 font-semibold">
                    {inv.quantity_kg} kg {inv.crop} • Billed to: {inv.recipient_name}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    <span>Issued: {new Date(inv.created_at).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}</span>
                  </div>
                </div>

                <div className="flex items-center gap-4 self-end md:self-center">
                  <div className="text-right">
                    <span className="text-lg font-black text-emerald-800 block">
                      ₹{inv.total_amount?.toLocaleString("en-IN")}
                    </span>
                    <span className="text-[10px] text-slate-400">Total Paid</span>
                  </div>

                  <button
                    onClick={() => setSelectedInvoice(inv)}
                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-600" />
                    <span>View Invoice</span>
                  </button>
                </div>
              </div>
            ))}
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
                  Consumer Tax & Compliance Invoice
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
                  <span className="text-slate-400 block text-[10px]">BILLED TO</span>
                  <span className="font-bold text-slate-800">{selectedInvoice.recipient_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">SUPPLIER PLATFORM</span>
                  <span className="font-bold text-slate-800">Farm2Market Procurement Hub</span>
                </div>
              </div>

              {/* Transparent Cost Breakdown */}
              <div className="border border-slate-200 rounded-xl p-3 space-y-2">
                <div className="font-bold text-slate-800 border-b border-slate-100 pb-1.5 flex justify-between">
                  <span>Item & Allocation</span>
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
                    <span>Cold Chain Logistics Fee</span>
                    <span>₹{selectedInvoice.logistics_fee.toFixed(2)}</span>
                  </div>
                ) : null}

                {selectedInvoice.platform_fee ? (
                  <div className="flex justify-between text-slate-500">
                    <span>Platform Service & Quality Assurance</span>
                    <span>₹{selectedInvoice.platform_fee.toFixed(2)}</span>
                  </div>
                ) : null}

                <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-slate-900 text-sm">
                  <span>Grand Total Paid</span>
                  <span className="text-emerald-700">₹{selectedInvoice.total_amount?.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-[11px] flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Verified Direct Farm Sourced. 100% trace of payout credited to producer escrow.</span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => {
                  window.print();
                }}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition"
              >
                <Printer className="w-4 h-4" /> Print / Save Invoice
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

