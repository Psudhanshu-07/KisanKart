import { NextResponse } from "next/server";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://optghlauklftecyjowqa.supabase.co";
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_t2vDCNHb3ubXJ6Ct2ZqZg_-6BfgA2y";

export async function GET(req: Request) {
  try {
    const { origin } = new URL(req.url);
    const dashRes = await fetch(`${origin}/api/admin/dashboard`, { cache: "no-store" });
    if (dashRes.ok) {
      const data = await dashRes.json();
      return NextResponse.json(data.produce_listings || []);
    }
    return NextResponse.json([], { status: 200 });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const listingId = searchParams.get("id");
    if (!listingId || !/^\d+$/.test(listingId)) {
      return NextResponse.json({ detail: "A valid listing id is required" }, { status: 400 });
    }

    const backendBase = process.env.BACKEND_URL;
    if (backendBase) {
      const backendRes = await fetch(
        `${backendBase.replace(/\/+$/, "")}/api/admin/produce/${listingId}`,
        { method: "DELETE" }
      );
      const data = await backendRes.json().catch(() => ({}));
      return NextResponse.json(data, { status: backendRes.status });
    }

    const headers = {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      Prefer: "return=minimal",
    };
    const deleteRes = await fetch(
      `${SUPABASE_URL}/rest/v1/produce_listings?id=eq.${listingId}`,
      { method: "DELETE", headers }
    );
    if (!deleteRes.ok) {
      const detail = await deleteRes.text();
      return NextResponse.json(
        { detail: detail || "Unable to remove produce listing" },
        { status: deleteRes.status }
      );
    }

    return NextResponse.json({ deleted: true, id: Number(listingId) });
  } catch (err: any) {
    return NextResponse.json({ detail: err.message || "Unable to remove produce listing" }, { status: 500 });
  }
}

