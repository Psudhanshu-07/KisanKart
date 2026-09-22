"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useApp } from "@/context/AppContext";
import { getProduceListings } from "@/lib/api";
import { getProduceImage } from "@/lib/produce-images";
import {
  ShoppingBag,
  Sparkles,
  Search,
  Filter,
  ShieldCheck,
  MapPin,
  Clock,
  CheckCircle2,
  Plus,
  ArrowRight,
  TrendingUp,
  FileText,
  Truck,
  Leaf,
  Layers
} from "lucide-react";

export default function ConsumerShopPage() {
  const { cart, addToCart, cartCount, cartTotal, currentUser } = useApp();
  const [listings, setListings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [toastMessage, setToastMessage] = useState("");

  useEffect(() => {
    loadListings();
  }, []);

  const loadListings = async () => {
    setLoading(true);
    try {
      const data = await getProduceListings();
      setListings(data);
      // Initialize default quantities
      const initialQtys: Record<number, number> = {};
      data.forEach((item: any) => {
        initialQtys[item.id] = 10; // Default 10 kg
      });
      setQuantities(initialQtys);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (id: number, delta: number) => {
    setQuantities((prev) => {
      const current = prev[id] || 10;
      const next = Math.max(5, current + delta);
      return { ...prev, [id]: next };
    });
  };

  const handleAddToCart = (produce: any) => {
    const qty = quantities[produce.id] || 10;
    const cropName = produce.produce_name || produce.crop_name || produce.crop || "Fresh Produce";
    const cropLower = cropName.toLowerCase();
    const farmerPrice = Number(produce.price_per_unit || 25.0);

    // Calculate retail consumer price (admin indicative: ₹32 for tomato, or price_per_unit * 1.18)
    const consumerPrice = cropLower.includes("tomato")
      ? 32.0
      : cropLower.includes("onion")
      ? 35.0
      : cropLower.includes("potato")
      ? 22.0
      : Number((farmerPrice * 1.18).toFixed(2));

    addToCart({
      id: produce.id,
      crop: cropName,
      grade: produce.grade || "A",
      quantity: qty,
      price_per_kg: consumerPrice,
      farmer_name: produce.farmer_name || "Verified Producer",
      farmer_id: produce.farmer_id || produce.user_id || 1,
      payment_upi_id: produce.payment_upi_id,
      district: produce.district || "Nashik",
      shelf_life_days: produce.freshness_window_days || produce.shelf_life_days || 5
    });

    setToastMessage(`Added ${qty} kg ${cropName} to cart!`);
    setTimeout(() => setToastMessage(""), 3500);
  };

  const filteredListings = listings.filter((item) => {
    const matchesCategory = selectedCategory === "All" || item.category === selectedCategory;
    const crop = (item.produce_name || item.crop_name || item.crop || "").toLowerCase();
    const district = (item.district || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = crop.includes(query) || district.includes(query);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3.5 rounded-2xl shadow-2xl border border-slate-700 flex items-center gap-3 text-xs font-bold animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <Link
            href="/shop/cart"
            className="ml-2 px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg uppercase tracking-wider text-[10px]"
          >
            Checkout →
          </Link>
        </div>
      )}

      <div className="bg-gradient-to-r from-emerald-900 via-emerald-800 to-green-900 rounded-3xl p-6 sm:p-10 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-3 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-emerald-200 border border-white/10">
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>KisanKart marketplace</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Direct farm produce, without middlemen
          </h1>
          <p className="text-emerald-100/90 text-sm leading-relaxed">
            Farmers and FPOs list fruits and vegetables directly, while buyers pay through verified farmer or FPO UPI/payment details with 100% transparency and no platform fee.
          </p>
        </div>

        <div className="bg-white/10 backdrop-blur-md border border-white/15 p-5 rounded-2xl sm:max-w-xs space-y-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>List or buy fresh crops</span>
          </div>
          <p className="text-xs text-white/90">
            As the platform grows, farmers and FPOs can list produce and buyers can pay directly to verified sellers.
          </p>
          <Link
            href="/login"
            className="w-full py-2.5 px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition"
          >
            <span>List Your Produce</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Shopping Utility Bar: Search, Category Filters & Active Cart Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {["All", "Vegetables", "Fruits", "Grains"].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? "bg-emerald-600 text-white shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search & Cart Actions */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search crop or district..."
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900"
            />
          </div>

          {/* Cart Pill */}
          <Link
            href="/shop/cart"
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition shrink-0"
          >
            <ShoppingBag className="w-4 h-4" />
            <span suppressHydrationWarning>Cart ({cartCount} kg)</span>
            <span className="bg-emerald-800 px-2 py-0.5 rounded-md font-mono" suppressHydrationWarning>
              ₹{cartTotal.toLocaleString("en-IN")}
            </span>
          </Link>

          {/* Orders Link */}
          <Link
            href="/shop/orders"
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition shrink-0"
          >
            <FileText className="w-4 h-4 text-slate-500" />
            <span className="hidden md:inline">My Orders</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-sm text-slate-500">Loading fresh farm produce catalog...</div>
      ) : filteredListings.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-emerald-300 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <Leaf className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-black text-slate-900">No fresh produce available yet</h2>
          <p className="mt-3 max-w-xl mx-auto text-sm text-slate-600">
            The marketplace is empty by design until farmers and FPOs list their fruits and vegetables. Once listings are added, buyers can browse live prices, stock availability, and direct payment details.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-bold text-white shadow-md shadow-emerald-700/20"
          >
            <span>List Produce</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredListings.map((item) => {
            const qty = quantities[item.id] || 10;
            const cropName = item.produce_name || item.crop_name || item.crop || "Fresh Produce";
            const cropLower = cropName.toLowerCase();
            const farmerShare = Number(item.price_per_unit || 27.0);

            const retailPrice = cropLower.includes("tomato")
              ? 32.0
              : cropLower.includes("onion")
              ? 35.0
              : cropLower.includes("potato")
              ? 22.0
              : Number((farmerShare * 1.18).toFixed(2));

            const logisticsShare = 3.0;
            const platformShare = Number(Math.max(0, retailPrice - farmerShare - logisticsShare).toFixed(2));
            const availKg = item.quantity_available ?? item.quantity_kg ?? 0;
            const shelfDays = item.freshness_window_days ?? item.shelf_life_days ?? 5;

            return (
              <div
                key={item.id}
                className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:border-emerald-300 hover:shadow-md transition flex flex-col justify-between overflow-hidden group"
              >
                {/* Product Image Banner */}
                {(() => {
                  const imgData = getProduceImage(cropName);
                  return (
                    <div className="relative h-48 w-full overflow-hidden bg-slate-100">
                      <img
                        src={imgData.url}
                        alt={cropName}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                        onError={(e) => {
                          const target = e.currentTarget;
                          target.onerror = null;
                          target.src = "https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=600&h=400&fit=crop&q=80";
                        }}
                      />
                      <div className={`absolute inset-0 bg-gradient-to-t ${imgData.gradient}`} />
                      <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                        <span className="px-2.5 py-1 bg-white/90 backdrop-blur-sm text-emerald-800 text-[10px] font-extrabold uppercase rounded-full shadow-sm">
                          🌾 Farm Fresh
                        </span>
                      </div>
                    </div>
                  );
                })()}
                <div className="p-6 space-y-4">
                  {/* Top Badge: Quality Grade & District */}
                  <div className="flex items-center justify-between">
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-full text-xs font-extrabold uppercase">
                      Grade {item.grade || "A"} Certified
                    </span>
                    <span className="text-xs text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {item.district || "Nashik"}
                    </span>
                  </div>

                  {/* Produce Title & Source */}
                  <div>
                    <h3 className="text-2xl font-black text-slate-900 group-hover:text-emerald-700 transition">
                      {cropName}
                    </h3>
                    <div className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Producer: {item.farmer_name || "Verified Local Producer"}</span>
                    </div>
                  </div>

                  {/* Shelf life & freshness tag */}
                  <div className="flex items-center gap-3 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-emerald-600" />
                      Harvested recently
                    </span>
                    <span>•</span>
                    <span className="text-emerald-700 font-semibold">
                      Freshness: {shelfDays} Days Shelf Life
                    </span>
                  </div>

                  {/* Pricing Box with Transparent Cost Breakdown */}
                  <div className="bg-emerald-50/50 border border-emerald-100 rounded-2xl p-4 space-y-2">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-slate-500 font-semibold">Consumer Price:</span>
                      <div>
                        <span className="text-3xl font-black text-emerald-900">₹{retailPrice.toFixed(2)}</span>
                        <span className="text-xs text-slate-500 font-medium"> / kg</span>
                      </div>
                    </div>

                    {/* Transparent Margin Pill */}
                    <div className="pt-2 border-t border-emerald-200/60 grid grid-cols-3 text-center text-[10px] gap-1">
                      <div className="bg-white/80 p-1.5 rounded-lg border border-emerald-100">
                        <span className="text-slate-400 block">Farmer Gets</span>
                        <span className="font-bold text-emerald-700">₹{farmerShare.toFixed(2)}</span>
                      </div>
                      <div className="bg-white/80 p-1.5 rounded-lg border border-emerald-100">
                        <span className="text-slate-400 block">Logistics</span>
                        <span className="font-bold text-slate-700">₹{logisticsShare.toFixed(2)}</span>
                      </div>
                      <div className="bg-white/80 p-1.5 rounded-lg border border-emerald-100">
                        <span className="text-slate-400 block">Platform</span>
                        <span className="font-bold text-slate-700">₹{platformShare.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Available Quantity */}
                  <div className="text-xs text-slate-500 flex justify-between">
                    <span>Available in Cluster:</span>
                    <span className="font-bold text-slate-800">{availKg} kg</span>
                  </div>
                </div>

                {/* Footer Controls: Quantity Stepper & Add to Cart */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-3">
                  {/* Stepper */}
                  <div className="flex items-center bg-white border border-slate-300 rounded-xl px-2 py-1">
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(item.id, -5)}
                      className="px-2 py-1 text-slate-500 hover:text-slate-900 font-black text-sm"
                    >
                      −
                    </button>
                    <span className="px-2 text-xs font-bold text-slate-800 font-mono">
                      {qty} kg
                    </span>
                    <button
                      type="button"
                      onClick={() => handleQuantityChange(item.id, 5)}
                      className="px-2 py-1 text-slate-500 hover:text-slate-900 font-black text-sm"
                    >
                      +
                    </button>
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    type="button"
                    onClick={() => handleAddToCart(item)}
                    className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add to Cart (₹{(qty * retailPrice).toFixed(0)})</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

