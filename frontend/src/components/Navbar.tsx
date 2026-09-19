"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/context/AppContext";
import {
  Sprout,
  UserCheck,
  Globe,
  Wifi,
  WifiOff,
  RefreshCw,
  SlidersHorizontal,
  Menu,
  X,
  ShoppingBag,
  FileText,
  LogOut,
  LogIn,
  ShieldCheck,
  ChevronDown
} from "lucide-react";
export function Navbar() {
  const {
    role,
    setRole,
    currentUser,
    logoutSession,
    language,
    setLanguage,
    t,
    dataSaver,
    setDataSaver,
    isOnline,
    cartCount
  } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logoutSession();
    router.push("/login");
  };

  // Determine role-relevant navigation links
  const activeRole = currentUser?.role || role;

  const getNavLinks = () => {
    const baseLinks = [];

    baseLinks.push({ href: "/shop", label: t.nav.marketplace });
    baseLinks.push({ href: "/buyer/requirement", label: `+ ${t.postRequirement}`, highlight: true });

    if (activeRole === "farmer" || activeRole === "fpo") {
      baseLinks.unshift({ href: "/farmer/dashboard", label: t.nav.farmerPortal, primary: true });
    } else if (activeRole === "admin") {
      baseLinks.unshift({ href: "/admin/dashboard", label: "Admin Operations", primary: true });
    }

    return baseLinks;
  };

  const navLinks = getNavLinks();

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-orange-100 shadow-sm">
      {/* Top Utility Bar */}
      <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 text-white text-xs px-4 py-1.5 flex flex-wrap items-center justify-between gap-2 border-b border-orange-300/60">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1 font-bold text-white">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
            </span>
            KisanKart
          </span>

          <span className="text-orange-100/80">|</span>

          {/* Active Session Label */}
          <div className="flex items-center gap-1.5 text-orange-50">
            {currentUser ? (
              <span className="inline-flex items-center gap-1">
                <span className="text-orange-100">{language === "en" ? "Signed in as:" : language === "hi" ? "लॉग इन:" : "लॉग इन:"}</span>
                <span className="font-bold text-white">{currentUser.full_name}</span>
                <span className="px-1.5 py-0.2 bg-orange-600/30 text-white rounded text-[10px] uppercase font-mono">
                  {currentUser.role}
                </span>
              </span>
            ) : (
              <span className="text-orange-100">{language === "en" ? "Guest Visitor" : language === "hi" ? "अतिथि" : "अतिथी"}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Data Saver Mode */}
          <button
            onClick={() => setDataSaver(!dataSaver)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded transition ${
              dataSaver ? "bg-orange-700 text-white" : "text-orange-50 hover:text-white"
            }`}
            title="Compresses media and pauses heavy sync for rural bandwidth"
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span className="hidden md:inline">{t.dataSaver}</span>: {dataSaver ? "ON" : "OFF"}
          </button>

          {/* Network State */}
          <span className="flex items-center gap-1 text-xs">
            {isOnline ? (
                <span className="text-white flex items-center gap-1">
                <Wifi className="w-3 h-3" /> {language === "en" ? "Online" : language === "hi" ? "ऑनलाइन" : "ऑनलाइन"}
              </span>
            ) : (
              <span className="text-yellow-100 flex items-center gap-1 font-bold">
                <WifiOff className="w-3 h-3" /> {language === "en" ? "Offline (Sync Active)" : language === "hi" ? "ऑफलाइन (सिंक सक्रिय)" : "ऑफलाइन (सिंक सक्रिय)"}
              </span>
            )}
          </span>

          {/* Language Selector */}
          <div className="flex items-center gap-1 bg-white/10 rounded px-1.5 py-0.5 border border-white/20">
            <Globe className="w-3 h-3 text-orange-50" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="bg-transparent text-white text-xs border-none focus:outline-none cursor-pointer"
            >
              <option value="en" className="bg-slate-900 text-white">English</option>
              <option value="hi" className="bg-slate-900 text-white">हिंदी</option>
              <option value="mr" className="bg-slate-900 text-white">मराठी</option>
            </select>
          </div>

        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white shadow-md shadow-orange-500/20 group-hover:scale-105 transition">
              <Sprout className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-slate-900 block leading-none">
                Kisan<span className="text-orange-600">Kart</span>
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1">
            {navLinks.map((link: any) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                    link.primary
                      ? "bg-orange-50 text-orange-800 border border-orange-200 hover:bg-orange-100 font-extrabold"
                      : link.highlight
                      ? "bg-yellow-50 text-yellow-900 border border-yellow-200 hover:bg-yellow-100"
                      : isActive
                      ? "bg-orange-50 text-orange-800 font-extrabold"
                      : "text-slate-600 hover:text-slate-900 hover:bg-orange-50/60"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right Action: Cart, Sign In / Log Out */}
          <div className="hidden sm:flex items-center gap-3">
            {/* Cart Button */}
            <Link
              href="/shop/cart"
              className="relative p-2 text-slate-600 hover:text-emerald-700 hover:bg-slate-100 rounded-xl transition"
              title="Shopping Cart"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>

            {currentUser ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleLogout}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <LogOut className="w-3.5 h-3.5 text-slate-500" />
                  <span>{language === "en" ? "Sign Out" : language === "hi" ? "लॉग आउट" : "लॉग आउट"}</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{language === "en" ? "Sign In" : language === "hi" ? "लॉग इन" : "लॉग इन"}</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Toggle */}
          <div className="flex lg:hidden items-center gap-2">
            <Link
              href="/shop/cart"
              className="relative p-2 text-slate-600 hover:text-emerald-700 rounded-xl"
            >
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-6 space-y-2">
          {navLinks.map((link: any) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`block px-3 py-2.5 rounded-xl text-sm font-bold ${
                pathname === link.href
                  ? "bg-emerald-50 text-emerald-800"
                  : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            {currentUser ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                className="w-full py-2.5 text-center bg-slate-100 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out ({currentUser.full_name})</span>
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full py-2.5 text-center bg-emerald-600 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
