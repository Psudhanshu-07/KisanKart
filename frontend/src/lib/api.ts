export const getApiBase = () => {
  if (process.env.NEXT_PUBLIC_API_URL) {
    let base = process.env.NEXT_PUBLIC_API_URL.trim().replace(/\/+$/, "");
    if (!base.endsWith("/api")) {
      base = `${base}/api`;
    }
    return base;
  }
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname;
    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return "http://127.0.0.1:8000/api";
    }
    // Remote deployment (Vercel, Render)
    return "/api";
  }
  return process.env.NODE_ENV === "production"
    ? "https://farm2market-api.onrender.com/api"
    : "http://127.0.0.1:8000/api";
};

export async function fetchFromApi(endpoint: string, options: RequestInit = {}) {
  const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  let base = getApiBase();

  // In browser, ensure /auth/login, /auth/register, /produce, and /admin use Next.js native API routes directly for instant Supabase verification
  if (
    typeof window !== "undefined" &&
    (cleanEndpoint.startsWith("/auth/login") ||
      cleanEndpoint.startsWith("/auth/register") ||
      cleanEndpoint.startsWith("/admin") ||
      cleanEndpoint === "/produce" ||
      cleanEndpoint.startsWith("/produce?"))
  ) {
    base = "/api";
  }

  const url = `${base}${cleanEndpoint}`;

  try {
    const token = typeof window !== "undefined" ? JSON.parse(localStorage.getItem("f2m_user") || "null")?.access_token : null;
    const res = await fetch(url, {
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(options.headers || {})
      },
      ...options
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ detail: res.statusText }));
      throw new Error(err.detail || `API error ${res.status}`);
    }
    return await res.json();
  } catch (error: any) {
    console.warn(`API call to ${url} failed, checking fallback:`, error.message);

    // In production, if relative /api fails, try direct Render backend fallback
    if (typeof window !== "undefined" && !url.includes("onrender.com") && window.location.hostname !== "localhost" && window.location.hostname !== "127.0.0.1") {
      const fallbackUrl = `https://farm2market-api.onrender.com/api${cleanEndpoint}`;
      try {
        const token = JSON.parse(localStorage.getItem("f2m_user") || "null")?.access_token;
        const res2 = await fetch(fallbackUrl, {
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...(options.headers || {})
          },
          ...options
        });
        if (res2.ok) {
          return await res2.json();
        }
      } catch (fallbackError) {
        console.warn(`Fallback to ${fallbackUrl} also failed:`, fallbackError);
      }
    }

    throw error;
  }
}

// Marketplace
export async function getProduceListings(filters: Record<string, string> = {}) {
  const params = new URLSearchParams(filters);
  return fetchFromApi(`/produce?${params.toString()}`);
}

export async function createProduceListing(data: any) {
  return fetchFromApi("/produce", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export async function parseVoiceListing(text: string) {
  return fetchFromApi("/produce/voice-parse", {
    method: "POST",
    body: JSON.stringify({ text })
  });
}

export async function getFarmerSummary() {
  return fetchFromApi("/produce/farmer-summary");
}

// Buyer Requirements & Matching
export async function postBuyerRequirement(data: any) {
  return fetchFromApi("/requirements", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export async function generateSmartSupplyPlan(data: {
  crop: string;
  quantity: number;
  grade?: string;
  district?: string;
  delivery_date?: string;
  max_budget?: number;
  requirement_id?: number;
}) {
  return fetchFromApi("/matching/generate", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export async function confirmProcurementPlan(data: {
  requirement_id: number;
  delivery_address: string;
  destination_city: string;
  plan_data?: Record<string, any>;
}) {
  return fetchFromApi("/orders/confirm-plan", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

// Logistics & Routes
export async function getActiveRoute() {
  return fetchFromApi("/routes/active");
}

export async function startRoute(routeId: number) {
  return fetchFromApi(`/routes/${routeId}/start`, { method: "POST" });
}

export async function reportDelay(routeId: number, delayMinutes: number, reason: string) {
  return fetchFromApi(`/routes/${routeId}/delay`, {
    method: "POST",
    body: JSON.stringify({ delay_minutes: delayMinutes, reason })
  });
}

// Digital Lot
export async function getDigitalLot(lotCode: string) {
  return fetchFromApi(`/lots/${lotCode}`);
}

// Demand Forecast & Admin
export async function getForecast(region: string, crop: string) {
  return fetchFromApi(`/forecast/${region}/${crop}`);
}

export async function getDecisionCards(role: string, region: string = "Mumbai") {
  return fetchFromApi(`/forecast/decision-cards/all?role=${role}&region=${region}`);
}

export async function getAdminDashboard() {
  return fetchFromApi("/admin/dashboard");
}

export async function getAdminFarmers() {
  return fetchFromApi("/admin/farmers");
}

export async function getAdminProduce() {
  return fetchFromApi("/admin/produce");
}

export async function getAdminDrivers() {
  return fetchFromApi("/admin/drivers");
}

export async function createRouteForOrder(orderId: number, driverId?: number) {
  return fetchFromApi("/routes/create-for-order", {
    method: "POST",
    body: JSON.stringify({ order_id: orderId, driver_id: driverId })
  });
}

export async function getNotifications(role?: string) {
  return fetchFromApi(`/admin/notifications${role ? `?role=${role}` : ""}`);
}

// Authentication
export async function loginUser(credentials: { email: string; password: string }) {
  return fetchFromApi("/auth/login", {
    method: "POST",
    body: JSON.stringify(credentials)
  });
}

export async function registerUser(data: {
  email: string;
  full_name: string;
  name?: string;
  fullName?: string;
  farmer_name?: string;
  password: string;
  role: "farmer" | "buyer" | "fpo";
  phone?: string;
  profile_data?: Record<string, any>;
}) {
  return fetchFromApi("/auth/register", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

// Pricing Management
export async function getPriceRules() {
  return fetchFromApi("/pricing/rules");
}

export async function getSinglePriceRule(crop: string, region: string = "Maharashtra", grade: string = "A") {
  const params = new URLSearchParams({ crop, region, grade });
  return fetchFromApi(`/pricing/rule?${params.toString()}`);
}

export async function updatePriceRule(data: {
  crop: string;
  region: string;
  grade: string;
  indicative_market_price: number;
  farmer_base_price: number;
  logistics_cost: number;
  platform_margin: number;
  reason?: string;
  admin_email?: string;
}) {
  return fetchFromApi("/pricing/rule", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

export async function getPriceHistory(crop?: string, region?: string) {
  const params = new URLSearchParams();
  if (crop) params.append("crop", crop);
  if (region) params.append("region", region);
  return fetchFromApi(`/pricing/history?${params.toString()}`);
}

// Invoices & Billing
export async function getInvoices(filters: { invoice_type?: string; user_name?: string } = {}) {
  const params = new URLSearchParams();
  if (filters.invoice_type) params.append("invoice_type", filters.invoice_type);
  if (filters.user_name) params.append("user_name", filters.user_name);
  return fetchFromApi(`/invoices?${params.toString()}`);
}

export async function payInvoice(invoiceId: number) {
  return fetchFromApi(`/invoices/${invoiceId}/pay`, { method: "POST" });
}

export async function createFPOPurchase(data: {
  member_farmer_name: string;
  crop: string;
  quantity: number;
  rate_per_kg: number;
  notes?: string;
}) {
  return fetchFromApi("/invoices/fpo-purchase", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

// Consumer E-Commerce Checkout
export async function consumerCheckout(data: {
  customer_name: string;
  customer_email: string;
  delivery_address: string;
  destination_city?: string;
  items: Array<{
    crop: string;
    grade?: string;
    quantity: number;
    price_per_kg: number;
    farmer_id?: number;
    farmer_name?: string;
    produce_id?: number;
  }>;
  total_amount: number;
}) {
  return fetchFromApi("/orders/consumer-checkout", {
    method: "POST",
    body: JSON.stringify(data)
  });
}

// Audit Logs
export async function getAuditLogs() {
  return fetchFromApi("/audit/logs");
}

