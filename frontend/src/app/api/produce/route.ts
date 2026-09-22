import { NextResponse } from "next/server";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://optghlauklftecyjowqa.supabase.co";
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_t2vDCNHb3ubXlJ6Ct2ZqZg_-6BfgA2y";

function parseAuthToken(authHeader: string | null): { userId: number; role: string; fullName: string } | null {
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.replace("Bearer ", "").trim();
  try {
    // Check if base64 encoded token
    const decoded = Buffer.from(token, "base64").toString("utf-8");
    const json = JSON.parse(decoded);
    return {
      userId: parseInt(json.sub || "1", 10),
      role: json.role || "farmer",
      fullName: json.full_name || json.name || "Producer",
    };
  } catch {
    // If JWT without base64 wrapper or other format, split payload
    try {
      const parts = token.split(".");
      if (parts.length >= 2) {
        const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
        return {
          userId: parseInt(payload.sub || "1", 10),
          role: payload.role || "farmer",
          fullName: payload.full_name || "Producer",
        };
      }
    } catch {
      return null;
    }
  }
  return null;
}

export async function GET(req: Request) {
  try {
    // 1. Try local or custom backend first if configured
    const backendBase = process.env.BACKEND_URL;
    const { searchParams } = new URL(req.url);
    if (backendBase) {
      try {
        const backendRes = await fetch(`${backendBase.replace(/\/+$/, "")}/api/produce?${searchParams.toString()}`, {
          cache: "no-store",
        });
        if (backendRes.ok) {
          const data = await backendRes.json();
          return NextResponse.json(data);
        }
      } catch {
        // Backend not reachable, fallback to Supabase
      }
    }

    // 2. Fetch from Supabase directly
    let queryUrl = `${SUPABASE_URL}/rest/v1/produce_listings?status=eq.AVAILABLE&order=created_at.desc&select=*,user:users(id,full_name,farmer_profile:farmer_profiles(upi_id,bank_verified),fpo_profile:fpo_profiles(upi_id,bank_verified))`;
    const crop = searchParams.get("crop");
    if (crop) {
      queryUrl += `&produce_name=ilike.*${encodeURIComponent(crop)}*`;
    }
    const category = searchParams.get("category");
    if (category) {
      queryUrl += `&category=ilike.*${encodeURIComponent(category)}*`;
    }

    const res = await fetch(queryUrl, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json([], { status: 200 });
    }

    const items = await res.json();
    const formatted = (items || []).map((item: any) => ({
      id: item.id,
      user_id: item.user_id,
      produce_name: item.produce_name,
      category: item.category || "Vegetable",
      quantity_available: item.quantity_available,
      quantity_initial: item.quantity_initial || item.quantity_available,
      unit: item.unit || "kg",
      grade: item.grade || "A",
      price_per_unit: item.price_per_unit,
      location_name: item.location_name || "Pimpalgaon Farm Cluster",
      district: item.district || "Nashik",
      state: item.state || "Maharashtra",
      harvest_date: item.harvest_date || item.created_at,
      freshness_window_days: item.freshness_window_days || 4,
      recommended_delivery_deadline: item.recommended_delivery_deadline,
      freshness_priority: item.freshness_priority || "HIGH",
      status: item.status || "AVAILABLE",
      is_fpo_aggregated: item.is_fpo_aggregated || false,
      created_at: item.created_at,
      farmer_name: item.user?.full_name || "Registered Producer",
      payment_upi_id:
        (item.user?.farmer_profile?.[0]?.bank_verified && item.user?.farmer_profile?.[0]?.upi_id) ||
        (item.user?.fpo_profile?.[0]?.bank_verified && item.user?.fpo_profile?.[0]?.upi_id) ||
        null,
      trust_score: 94.0,
    }));

    return NextResponse.json(formatted);
  } catch (error: any) {
    return NextResponse.json({ detail: error.message || "Failed to fetch listings" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const authHeader = req.headers.get("Authorization");
    const userAuth = parseAuthToken(authHeader);

    const userId = userAuth ? userAuth.userId : (body.user_id || 1);
    const userRole = userAuth ? userAuth.role : (body.role || "farmer");

    // Resolve flexible field names
    const produce_name = (
      body.produce_name ||
      body.crop_name ||
      body.crop ||
      body.name ||
      "Tomato"
    ).trim();

    const quantity = parseFloat(
      body.quantity_available ||
      body.quantity_kg ||
      body.quantity ||
      100
    );

    const price = parseFloat(
      body.price_per_unit ||
      body.price_per_kg ||
      body.rate_per_kg ||
      body.farmer_price ||
      25
    );

    const shelf_days = parseInt(
      body.freshness_window_days ||
      body.shelf_life_days ||
      (produce_name.toLowerCase().includes("tomato") ? 5 : 10),
      10
    );

    const now = new Date();
    const deadline = new Date(now.getTime() + shelf_days * 24 * 60 * 60 * 1000);

    const payload = {
      user_id: userId,
      produce_name: produce_name.charAt(0).toUpperCase() + produce_name.slice(1),
      category: body.category || "Vegetable",
      quantity_available: quantity,
      quantity_initial: quantity,
      unit: body.unit || "kg",
      grade: body.grade || "A",
      price_per_unit: price,
      location_name: body.location_name || "Pimpalgaon Farm Cluster",
      district: body.district || "Nashik",
      state: body.state || "Maharashtra",
      harvest_date: body.harvest_date ? new Date(body.harvest_date).toISOString() : now.toISOString(),
      freshness_window_days: shelf_days,
      recommended_delivery_deadline: deadline.toISOString(),
      freshness_priority: body.freshness_priority || (shelf_days <= 7 ? "HIGH" : "LOW"),
      status: "AVAILABLE",
      is_fpo_aggregated: userRole === "fpo" || Boolean(body.is_fpo_aggregated),
    };

    // 1. Try local/custom backend if configured
    const backendBase = process.env.BACKEND_URL;
    if (backendBase) {
      try {
        const backendRes = await fetch(`${backendBase.replace(/\/+$/, "")}/api/produce`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(authHeader ? { Authorization: authHeader } : {}),
          },
          body: JSON.stringify(payload),
        });
        if (backendRes.ok) {
          const data = await backendRes.json();
          return NextResponse.json(data);
        }
      } catch {
        // Backend not reachable, continue to direct Supabase insert
      }
    }

    // 2. Direct Supabase Insert
    const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/produce_listings`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(payload),
    });

    if (!insertRes.ok) {
      const err = await insertRes.json().catch(() => ({ message: insertRes.statusText }));
      return NextResponse.json(
        { detail: err.message || "Failed to create produce listing" },
        { status: 500 }
      );
    }

    const inserted = await insertRes.json();
    const item = Array.isArray(inserted) ? inserted[0] : inserted;

    return NextResponse.json({
      id: item.id,
      user_id: item.user_id,
      produce_name: item.produce_name,
      category: item.category,
      quantity_available: item.quantity_available,
      quantity_initial: item.quantity_initial,
      unit: item.unit,
      grade: item.grade,
      price_per_unit: item.price_per_unit,
      location_name: item.location_name,
      district: item.district,
      state: item.state,
      harvest_date: item.harvest_date,
      freshness_window_days: item.freshness_window_days,
      recommended_delivery_deadline: item.recommended_delivery_deadline,
      freshness_priority: item.freshness_priority,
      status: item.status,
      is_fpo_aggregated: item.is_fpo_aggregated,
      created_at: item.created_at,
      farmer_name: userAuth?.fullName || "Registered Producer",
      trust_score: 94.0,
    });
  } catch (error: any) {
    return NextResponse.json(
      { detail: error.message || "Listing submission failed" },
      { status: 500 }
    );
  }
}

