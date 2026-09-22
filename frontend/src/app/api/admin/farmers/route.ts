import { NextResponse } from "next/server";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://optghlauklftecyjowqa.supabase.co";
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_t2vDCNHb3ubXlJ6Ct2ZqZg_-6BfgA2y";

export async function GET(req: Request) {
  try {
    const { origin } = new URL(req.url);
    const dashRes = await fetch(`${origin}/api/admin/dashboard`, { cache: "no-store" });
    if (dashRes.ok) {
      const data = await dashRes.json();
      return NextResponse.json(data.farmers_list || []);
    }
    return NextResponse.json([], { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("id");
    if (!userId || !/^\d+$/.test(userId)) {
      return NextResponse.json({ detail: "A valid producer id is required" }, { status: 400 });
    }

    const backendBase = process.env.BACKEND_URL;
    if (backendBase) {
      const response = await fetch(`${backendBase.replace(/\/+$/, "")}/api/admin/farmers/${userId}`, { method: "DELETE" });
      const data = await response.json().catch(() => ({}));
      return NextResponse.json(data, { status: response.status });
    }

    const headers = {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    };
    const userResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}&role=in.(farmer,fpo)`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ is_active: false }),
    });
    await fetch(`${SUPABASE_URL}/rest/v1/produce_listings?user_id=eq.${userId}&status=eq.AVAILABLE`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ status: "REMOVED" }),
    });
    if (!userResponse.ok) {
      return NextResponse.json({ detail: "Unable to remove producer" }, { status: userResponse.status });
    }
    return NextResponse.json({ removed: true, id: Number(userId) });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Unable to remove producer" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("id");
    const changes = await req.json();
    if (!userId || !/^\d+$/.test(userId)) {
      return NextResponse.json({ detail: "A valid producer id is required" }, { status: 400 });
    }

    const backendBase = process.env.BACKEND_URL;
    if (backendBase) {
      const response = await fetch(`${backendBase.replace(/\/+$/, "")}/api/admin/farmers/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      });
      const data = await response.json().catch(() => ({}));
      return NextResponse.json(data, { status: response.status });
    }

    const headers = {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=minimal",
    };
    const userResponse = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}&role=in.(farmer,fpo)`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ full_name: changes.full_name, phone: changes.phone }),
    });
    const userLookup = await fetch(`${SUPABASE_URL}/rest/v1/users?id=eq.${userId}&select=role`, {
      headers,
      cache: "no-store",
    });
    const user = (await userLookup.json())?.[0];
    const profileTable = user?.role === "fpo" ? "fpo_profiles" : "farmer_profiles";
    const profileChanges = user?.role === "fpo"
      ? { fpo_name: changes.farm_name, district: changes.district, upi_id: changes.upi_id, bank_verified: true }
      : { farm_name: changes.farm_name, district: changes.district, upi_id: changes.upi_id, bank_verified: true };
    const profileResponse = await fetch(`${SUPABASE_URL}/rest/v1/${profileTable}?user_id=eq.${userId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify(profileChanges),
    });
    if (!userResponse.ok || !profileResponse.ok) {
      return NextResponse.json({ detail: "Unable to update producer details" }, { status: 400 });
    }
    return NextResponse.json({ updated: true, id: Number(userId) });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Unable to update producer details" }, { status: 500 });
  }
}

