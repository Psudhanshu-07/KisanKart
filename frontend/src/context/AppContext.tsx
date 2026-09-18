"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { Language, translations } from "@/lib/translations";
import { getOfflineListings, clearSyncedListings } from "@/lib/offline-storage";
import { createProduceListing } from "@/lib/api";

export type Role = "farmer" | "fpo" | "buyer" | "driver" | "admin";

export interface UserSession {
  user_id: number;
  email: string;
  full_name: string;
  role: Role;
  access_token?: string;
}

export interface CartItem {
  id: number;
  crop: string;
  grade: string;
  quantity: number;
  price_per_kg: number;
  farmer_name: string;
  farmer_id: number;
  district: string;
  shelf_life_days?: number;
}

interface AppContextType {
  role: Role;
  setRole: (role: Role) => void;
  currentUser: UserSession | null;
  setCurrentUser: (user: UserSession | null) => void;
  loginSession: (user: UserSession) => void;
  logoutSession: () => void;
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: number) => void;
  updateCartQuantity: (id: number, qty: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations.en;
  dataSaver: boolean;
  setDataSaver: (val: boolean) => void;
  isOnline: boolean;
  isDemoMode: boolean;
  unreadCount: number;
  syncOfflineListings: () => Promise<number>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [role, setRoleState] = useState<Role>("buyer");
  const [currentUser, setCurrentUserState] = useState<UserSession | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [language, setLanguageState] = useState<Language>("en");
  const [dataSaver, setDataSaver] = useState<boolean>(false);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isDemoMode] = useState<boolean>(false);
  const [unreadCount] = useState<number>(0);

  // Initialize from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      document.documentElement.lang = language;
      const storedUser = localStorage.getItem("f2m_user");
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          setCurrentUserState(parsed);
          setRoleState(parsed.role);
        } catch (e) {
          console.error("Error parsing stored user", e);
        }
      }
      const storedLanguage = localStorage.getItem("f2m_language") as Language | null;
      if (storedLanguage && storedLanguage in translations) {
        setLanguageState(storedLanguage);
      }
      const storedCart = localStorage.getItem("f2m_cart");
      if (storedCart) {
        try {
          setCart(JSON.parse(storedCart));
        } catch (e) {
          console.error("Error parsing stored cart", e);
        }
      }
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (newLanguage: Language) => {
    setLanguageState(newLanguage);
    if (typeof window !== "undefined") {
      localStorage.setItem("f2m_language", newLanguage);
    }
  };

  const setRole = (newRole: Role) => {
    setRoleState(newRole);
    if (currentUser) {
      const updated = { ...currentUser, role: newRole };
      setCurrentUserState(updated);
      if (typeof window !== "undefined") {
        localStorage.setItem("f2m_user", JSON.stringify(updated));
      }
    }
  };

  const loginSession = (user: UserSession) => {
    setCurrentUserState(user);
    setRoleState(user.role);
    if (typeof window !== "undefined") {
      localStorage.setItem("f2m_user", JSON.stringify(user));
    }
  };

  const logoutSession = () => {
    setCurrentUserState(null);
    setRoleState("buyer");
    if (typeof window !== "undefined") {
      localStorage.removeItem("f2m_user");
    }
  };

  const addToCart = (item: CartItem) => {
    setCart((prev) => {
      const existing = prev.find((p) => p.id === item.id);
      let nextCart: CartItem[];
      if (existing) {
        nextCart = prev.map((p) =>
          p.id === item.id ? { ...p, quantity: p.quantity + item.quantity } : p
        );
      } else {
        nextCart = [...prev, item];
      }
      if (typeof window !== "undefined") {
        localStorage.setItem("f2m_cart", JSON.stringify(nextCart));
      }
      return nextCart;
    });
  };

  const removeFromCart = (id: number) => {
    setCart((prev) => {
      const nextCart = prev.filter((p) => p.id !== id);
      if (typeof window !== "undefined") {
        localStorage.setItem("f2m_cart", JSON.stringify(nextCart));
      }
      return nextCart;
    });
  };

  const updateCartQuantity = (id: number, qty: number) => {
    if (qty <= 0) {
      removeFromCart(id);
      return;
    }
    setCart((prev) => {
      const nextCart = prev.map((p) => (p.id === id ? { ...p, quantity: qty } : p));
      if (typeof window !== "undefined") {
        localStorage.setItem("f2m_cart", JSON.stringify(nextCart));
      }
      return nextCart;
    });
  };

  const clearCart = () => {
    setCart([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem("f2m_cart");
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.quantity * item.price_per_kg, 0);
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Network monitor for PWA / offline support
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsOnline(navigator.onLine);
      const handleOnline = () => {
        setIsOnline(true);
        syncOfflineListings();
      };
      const handleOffline = () => setIsOnline(false);

      window.addEventListener("online", handleOnline);
      window.addEventListener("offline", handleOffline);
      return () => {
        window.removeEventListener("online", handleOnline);
        window.removeEventListener("offline", handleOffline);
      };
    }
  }, []);

  const syncOfflineListings = async (): Promise<number> => {
    const offlineItems = getOfflineListings();
    if (offlineItems.length === 0) return 0;

    let syncedCount = 0;
    for (const item of offlineItems) {
      try {
        await createProduceListing(item);
        syncedCount++;
      } catch (err) {
        console.error("Sync error for item:", item, err);
      }
    }
    if (syncedCount > 0) {
      clearSyncedListings();
    }
    return syncedCount;
  };

  const t = translations[language];

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        currentUser,
        setCurrentUser: setCurrentUserState,
        loginSession,
        logoutSession,
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        clearCart,
        cartTotal,
        cartCount,
        language,
        setLanguage,
        t,
        dataSaver,
        setDataSaver,
        isOnline,
        isDemoMode,
        unreadCount,
        syncOfflineListings
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}


