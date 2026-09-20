import { NextResponse } from "next/server";

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

