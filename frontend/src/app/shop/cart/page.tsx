"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import { consumerCheckout } from "@/lib/api";
import {
  ShoppingBag,
  Trash2,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Truck,
  FileText,
  MapPin,
  Clock,
  Sparkles,
  AlertCircle
} from "lucide-react";

export default function ConsumerCartCheckoutPage() {
  const router = useRouter();
  const { cart, removeFromCart, updateCartQuantity, clearCart, cartTotal, currentUser } = useApp();

  // Delivery Form State
  const [customerName, setCustomerName] = useState(currentUser?.full_name || "Priya Sharma");
  const [customerEmail, setCustomerEmail] = useState(currentUser?.email || "priya@freshmart.in");
  const [deliveryAddress, setDeliveryAddress] = useState("Central Distribution Hub, Unit 4B, Lower Parel");
  const [destinationCity, setDestinationCity] = useState("Mumbai");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [checkoutResult, setCheckoutResult] = useState<any>(null);

  // Breakdown calculations
  const totalKg = cart.reduce((sum, item) => sum + item.quantity, 0);
  // Farmer gets ₹27/kg avg, logistics ₹3/kg, platform ₹2/kg
  const farmerTotal = cart.reduce((sum, item) => sum + item.quantity * (item.price_per_kg * 0.84375), 0);
  const logisticsTotal = cart.reduce((sum, item) => sum + item.quantity * 3.0, 0);
  const platformTotal = Math.max(0, cartTotal - farmerTotal - logisticsTotal);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;

    setSubmitting(true);
    setErrorMessage("");

    try {
      const payload = {
        customer_name: customerName,
        customer_email: customerEmail,
        delivery_address: deliveryAddress,
        destination_city: destinationCity,
        items: cart.map((item) => ({
          crop: item.crop,
          grade: item.grade,
          quantity: item.quantity,
          price_per_kg: item.price_per_kg,
          farmer_id: item.farmer_id,
          farmer_name: item.farmer_name,
          produce_id: item.id
        })),
        total_amount: cartTotal
      };

      const result = await consumerCheckout(payload);
      setCheckoutResult(result);
      clearCart();
    } catch (err: any) {
      setErrorMessage(err.message || "Checkout failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (checkoutResult) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 space-y-8">
        <div className="bg-white rounded-3xl border border-emerald-200 shadow-xl p-8 text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-full uppercase tracking-wider">
              Order Confirmed & Escrow Reserved
            </span>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              Thank You for Your Order!
            </h1>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              Your order has been matched with farm-gate producers and assigned to the morning cold-chain delivery fleet.
            </p>
          </div>

          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 text-left text-xs space-y-3">
            <div className="grid grid-cols-2 gap-3 pb-3 border-b border-slate-200">
              <div>
                <span className="text-slate-400 block text-[10px]">ORDER IDENTIFIER</span>
                <span className="font-mono font-bold text-slate-900">
                  {checkoutResult.order?.order_code || "F2M-ORD-2026-092"}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">TOTAL VALUE PAID</span>
                <span className="font-bold text-emerald-700 text-sm">
                  ₹{checkoutResult.order?.total_amount?.toLocaleString("en-IN") || cartTotal.toLocaleString("en-IN")}
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="font-bold text-slate-800">Generated Compliance Invoices:</div>
              <div className="flex flex-col sm:flex-row gap-2">
                {checkoutResult.consumer_invoice && (
                  <div className="flex-1 p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">CONSUMER TAX INVOICE</span>
                    <span className="font-mono font-bold text-slate-800 text-xs">
                      {checkoutResult.consumer_invoice.invoice_number}
                    </span>
                  </div>
                )}
                {checkoutResult.farmer_invoice && (
                  <div className="flex-1 p-3 bg-white rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">FARMER SETTLEMENT VOUCHER</span>
                    <span className="font-mono font-bold text-emerald-800 text-xs">
                      {checkoutResult.farmer_invoice.invoice_number}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {checkoutResult.digital_lot && (
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-emerald-700 block font-bold">DIGITAL LOT PASSPORT</span>
                  <span className="font-mono font-bold text-emerald-950 text-xs">
                    {checkoutResult.digital_lot.lot_code}
                  </span>
                </div>
                <Link
                  href={`/lot/${checkoutResult.digital_lot.lot_code}`}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold"
                >
                  View Passport →
                </Link>
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Link
              href="/shop/orders"
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-sm transition"
            >
              <FileText className="w-4 h-4" /> View My Orders & Invoices
            </Link>
            <Link
              href="/shop"
              className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <ShoppingBag className="w-7 h-7 text-emerald-600" />
            <span>Review Cart & Checkout</span>
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Transparent direct farm procurement with zero predatory fees
          </p>
        </div>
        <Link
          href="/shop"
          className="text-xs font-bold text-emerald-700 hover:text-emerald-800"
        >
          ← Back to Catalog
        </Link>
      </div>

      {cart.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">Your shopping cart is empty</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Explore our farm-fresh listings and select Grade A produce directly from verified farmers.
          </p>
          <Link
            href="/shop"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md transition"
          >
            <span>Start Shopping</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Cart Items List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-100">
              {cart.map((item) => (
                <div key={item.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900 text-base">{item.crop}</span>
                      <span className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded-full text-[10px] font-bold border border-emerald-200">
                        Grade {item.grade}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500">
                      Farmer: {item.farmer_name} • {item.district}
                    </div>
                    <div className="text-xs text-emerald-700 font-semibold">
                      Verified payment UPI: {item.payment_upi_id || "Unavailable"}
                    </div>
                    <div className="text-xs text-slate-600 font-semibold">
                      ₹{item.price_per_kg.toFixed(2)} / kg
                    </div>
                  </div>

                  {/* Quantity and Line Total */}
                  <div className="flex items-center gap-4 self-end sm:self-center">
                    <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-2 py-1">
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(item.id, item.quantity - 5)}
                        className="px-2 py-0.5 text-slate-600 hover:text-slate-900 font-bold"
                      >
                        −
                      </button>
                      <span className="px-2 text-xs font-mono font-bold text-slate-800">
                        {item.quantity} kg
                      </span>
                      <button
                        type="button"
                        onClick={() => updateCartQuantity(item.id, item.quantity + 5)}
                        className="px-2 py-0.5 text-slate-600 hover:text-slate-900 font-bold"
                      >
                        +
                      </button>
                    </div>

                    <div className="text-right w-24">
                      <span className="font-black text-slate-900 text-base">
                        ₹{(item.quantity * item.price_per_kg).toFixed(0)}
                      </span>
                    </div>

                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                      title="Remove Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Transparent Cost Breakdown Display */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-3xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-700" />
                  <h3 className="text-sm font-extrabold text-emerald-950 uppercase tracking-wider">
                    Transparent Price Guarantee
                  </h3>
                </div>
                <span className="text-xs text-emerald-800 font-bold">100% Traceable</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white p-4 rounded-2xl border border-emerald-100 space-y-1">
                  <span className="text-[11px] text-slate-500 font-semibold block">Farmer Payout (84.4%)</span>
                  <div className="text-xl font-black text-emerald-800">
                    ₹{farmerTotal.toFixed(0)}
                  </div>
                  <p className="text-[10px] text-slate-400">Directly transferred to producer escrow</p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-emerald-100 space-y-1">
                  <span className="text-[11px] text-slate-500 font-semibold block">Logistics & Cold Fleet (9.4%)</span>
                  <div className="text-xl font-black text-slate-800">
                    ₹{logisticsTotal.toFixed(0)}
                  </div>
                  <p className="text-[10px] text-slate-400">Door-to-door temperature controlled vehicle</p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-emerald-100 space-y-1">
                  <span className="text-[11px] text-slate-500 font-semibold block">Platform Fee (6.2%)</span>
                  <div className="text-xl font-black text-slate-800">
                    ₹{platformTotal.toFixed(0)}
                  </div>
                  <p className="text-[10px] text-slate-400">Quality QA, insurance & digital lot passport</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Delivery Details & Place Order */}
          <div className="space-y-6">
            <form
              onSubmit={handleCheckout}
              className="bg-white p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-sm space-y-5"
            >
              <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">
                Delivery & Customer Details
              </h3>

              {errorMessage && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Recipient Name / Business
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Email Address for Invoicing
                </label>
                <input
                  type="email"
                  required
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Delivery Destination City
                </label>
                <select
                  value={destinationCity}
                  onChange={(e) => setDestinationCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 text-slate-900"
                >
                  <option value="Mumbai">Mumbai (Central Hub)</option>
                  <option value="Pune">Pune (Western Hub)</option>
                  <option value="Thane">Thane & Navi Mumbai</option>
                  <option value="Nashik">Nashik Urban</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Delivery Street Address
                </label>
                <textarea
                  rows={2}
                  required
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-emerald-500 text-slate-900"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between text-slate-500">
                  <span>Gross Produce Volume:</span>
                  <span className="font-bold text-slate-900">{totalKg} kg</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Shipping & Cold Fleet:</span>
                  <span className="font-bold text-emerald-600">Included in transparent breakdown</span>
                </div>
                <div className="flex justify-between text-base font-black text-slate-900 pt-2 border-t border-slate-200">
                  <span>Total Due:</span>
                  <span className="text-emerald-700">₹{cartTotal.toLocaleString("en-IN")}</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-700/25 transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {submitting ? (
                  <span>Generating Order & Invoices...</span>
                ) : (
                  <>
                    <span>Confirm & Pay ₹{cartTotal.toLocaleString("en-IN")}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

