"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CheckCircle2, MapPin, Mail, Lock, Phone, User, Sprout, ShoppingBag, ShieldCheck, Wallet, Users } from "lucide-react";
import { registerUser } from "@/lib/api";
import { useApp } from "@/context/AppContext";

export default function RegisterPage() {
  const router = useRouter();
  const { loginSession } = useApp();

  const [role, setRole] = useState<"farmer" | "fpo" | "buyer">("farmer");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [district, setDistrict] = useState("Nashik");
  const [address, setAddress] = useState("");
  const [upiId, setUpiId] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const profileData: Record<string, any> = {
        district,
        address,
        city: district,
        state: "Maharashtra",
      };

      if (role === "farmer") {
        profileData.farm_name = businessName || `${fullName}'s Farm`;
        profileData.village = "Farm Gate";
        profileData.upi_id = upiId || "";
      } else if (role === "fpo") {
        profileData.fpo_name = businessName || `${fullName} FPO`;
        profileData.business_name = businessName || `${fullName} FPO`;
        profileData.registration_number = "FPO-" + Math.floor(100000 + Math.random() * 900000);
        profileData.district = district;
        profileData.upi_id = upiId || "";
      } else {
        profileData.business_name = businessName || `${fullName}'s Store`;
        profileData.buyer_type = "retailer";
        profileData.delivery_address = address || "Buyer address";
      }

      const res = await registerUser({
        email,
        full_name: fullName,
        name: fullName,
        fullName: fullName,
        farmer_name: fullName,
        password,
        role,
        phone,
        profile_data: profileData,
      });

      loginSession({
        user_id: res.user_id,
        email: res.email,
        full_name: res.full_name,
        role: res.role,
        access_token: res.access_token,
      });

      if (res.role === "farmer" || res.role === "fpo") {
        router.push("/farmer/dashboard");
      } else {
        router.push("/shop");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Unable to create account right now.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] bg-gradient-to-b from-orange-50 via-white to-amber-50 px-4 py-10">
      <div className="mx-auto max-w-5xl rounded-[32px] border border-orange-100 bg-white shadow-xl shadow-orange-100/60 overflow-hidden">
        <div className="grid md:grid-cols-[1.1fr_1.4fr]">
          <div className="bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 p-8 text-white">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] border border-white/20">
              <CheckCircle2 className="h-4 w-4" />
              KisanKart signup
            </div>
            <h1 className="mt-6 text-3xl font-black tracking-tight">Create your trusted account</h1>
            <p className="mt-4 text-sm text-orange-50/90 leading-relaxed">
              Join as a farmer or buyer to list produce, shop fresh items, and handle direct payments with confidence.
            </p>

            <div className="mt-8 space-y-4">
              <div className="flex items-start gap-3 rounded-2xl bg-white/10 p-3 border border-white/15">
                <ShieldCheck className="mt-0.5 h-5 w-5 text-white" />
                <div>
                  <div className="font-bold">Verified trust</div>
                  <div className="text-xs text-orange-50/80">Clear seller and buyer profiles for transparent trade.</div>
                </div>
              </div>

              <div className="flex items-start gap-3 rounded-2xl bg-white/10 p-3 border border-white/15">
                <Wallet className="mt-0.5 h-5 w-5 text-white" />
                <div>
                  <div className="font-bold">Direct payment details</div>
                  <div className="text-xs text-orange-50/80">Capture UPI or bank details for direct settlement.</div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-orange-600">Account type</div>
                <h2 className="mt-1 text-2xl font-black text-slate-900">Choose your role</h2>
              </div>
            </div>

            <div className="mb-6 grid grid-cols-3 gap-2 rounded-2xl bg-orange-50 p-2 border border-orange-100">
              <button
                type="button"
                onClick={() => setRole("farmer")}
                className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-bold transition ${
                  role === "farmer" ? "bg-orange-500 text-white shadow-md" : "bg-white text-slate-700 hover:bg-orange-100/50"
                }`}
              >
                <Sprout className="h-4 w-4" />
                Farmer
              </button>
              <button
                type="button"
                onClick={() => setRole("fpo")}
                className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-bold transition ${
                  role === "fpo" ? "bg-orange-500 text-white shadow-md" : "bg-white text-slate-700 hover:bg-orange-100/50"
                }`}
              >
                <Users className="h-4 w-4" />
                FPO
              </button>
              <button
                type="button"
                onClick={() => setRole("buyer")}
                className={`flex items-center justify-center gap-1.5 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-bold transition ${
                  role === "buyer" ? "bg-orange-500 text-white shadow-md" : "bg-white text-slate-700 hover:bg-orange-100/50"
                }`}
              >
                <ShoppingBag className="h-4 w-4" />
                Buyer
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {errorMessage && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
                  {errorMessage}
                </div>
              )}

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">Full name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none ring-0 transition focus:border-orange-400 focus:bg-white"
                      placeholder="Enter full name"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      required
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">Phone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white"
                      placeholder="+91 98******"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                    <input
                      required
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white"
                      placeholder="Create password"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">District</label>
                  <select
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 px-3 text-sm text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white"
                  >
                    <option value="Nashik">Nashik</option>
                    <option value="Pune">Pune</option>
                    <option value="Mumbai">Mumbai</option>
                    <option value="Nagpur">Nagpur</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">
                    {role === "farmer" ? "Farm / business name" : role === "fpo" ? "FPO organization name" : "Business / store name"}
                  </label>
                  <input
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 px-3 text-sm text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white"
                    placeholder={role === "farmer" ? "e.g. Shri Ganesh Farms" : role === "fpo" ? "e.g. Sahyadri Farmers Producer Co." : "e.g. Fresh Basket Foods"}
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
                    <textarea
                      required
                      rows={3}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white"
                      placeholder={role === "farmer" ? "Farm address or pickup location" : role === "fpo" ? "FPO office or aggregation center address" : "Delivery address"}
                    />
                  </div>
                </div>

                {(role === "farmer" || role === "fpo") && (
                  <div className="sm:col-span-2">
                    <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-700">UPI / payment receiving ID</label>
                    <input
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-slate-50 py-2.5 px-3 text-sm text-slate-900 outline-none transition focus:border-orange-400 focus:bg-white"
                      placeholder={role === "fpo" ? "fpo@upi or demo@kisankart" : "farmername@upi or demo@kisankart"}
                    />
                  </div>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition hover:from-orange-600 hover:to-amber-600 disabled:opacity-60"
              >
                {loading ? "Creating account..." : `Create ${role === "farmer" ? "Farmer" : role === "fpo" ? "FPO" : "Buyer"} account`}
              </button>
            </form>

            <div className="mt-5 text-center text-xs text-slate-500">
              Already have an account? <Link href="/login" className="font-bold text-orange-700">Sign in</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
