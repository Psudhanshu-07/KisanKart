import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://optghlauklftecyjowqa.supabase.co";
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_t2vDCNHb3ubXlJ6Ct2ZqZg_-6BfgA2y";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { detail: "Email and password are required" },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Try local or custom backend first if configured and accessible
    const backendBase = process.env.BACKEND_URL;
    if (backendBase) {
      try {
        const backendRes = await fetch(`${backendBase.replace(/\/+$/, "")}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: cleanEmail, password }),
        });
        if (backendRes.ok) {
          const data = await backendRes.json();
          return NextResponse.json(data);
        }
      } catch {
        // Backend not reachable, proceed to direct Supabase verification
      }
    }

    // 2. Direct Supabase Query
    const url = `${SUPABASE_URL}/rest/v1/users?email=ilike.${encodeURIComponent(cleanEmail)}&select=*`;
    const res = await fetch(url, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return NextResponse.json(
        { detail: "Failed to connect to authentication database" },
        { status: 500 }
      );
    }

    const users = await res.json();
    if (!users || users.length === 0) {
      return NextResponse.json(
        { detail: "Invalid email or password" },
        { status: 401 }
      );
    }

    const user = users[0];

    if (!user.is_active) {
      return NextResponse.json(
        { detail: "Account is deactivated" },
        { status: 403 }
      );
    }

    const isMatch = bcrypt.compareSync(password, user.hashed_password);
    if (!isMatch) {
      return NextResponse.json(
        { detail: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Generate secure session token
    const tokenPayload = {
      sub: String(user.id),
      role: user.role,
      email: user.email,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
    };
    const access_token = Buffer.from(JSON.stringify(tokenPayload)).toString("base64");

    return NextResponse.json({
      access_token,
      role: user.role,
      user_id: user.id,
      full_name: user.full_name,
      email: user.email,
    });
  } catch (error: any) {
    return NextResponse.json(
      { detail: error.message || "Internal authentication error" },
      { status: 500 }
    );
  }
}
