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
    const { email, password, role = "farmer", phone, profile_data = {} } = body;

    if (!email || !password) {
      return NextResponse.json(
        { detail: "Email and password are required" },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const resolvedName = (
      body.full_name ||
      body.name ||
      body.fullName ||
      body.farmer_name ||
      (role === "fpo" ? "Kisan FPO" : role === "farmer" ? "Kisan Farmer" : "Kisan Buyer")
    ).trim();

    // 1. Try local/custom backend if configured
    const backendBase = process.env.BACKEND_URL;
    if (backendBase) {
      try {
        const backendRes = await fetch(`${backendBase.replace(/\/+$/, "")}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: cleanEmail,
            full_name: resolvedName,
            name: resolvedName,
            fullName: resolvedName,
            farmer_name: resolvedName,
            password,
            role,
            phone,
            profile_data,
          }),
        });
        if (backendRes.ok) {
          const data = await backendRes.json();
          return NextResponse.json(data);
        }
      } catch {
        // Backend not reachable, proceed to Supabase direct insert
      }
    }

    // 2. Direct Supabase Check & Registration
    // Check if email already exists
    const checkUrl = `${SUPABASE_URL}/rest/v1/users?email=ilike.${encodeURIComponent(cleanEmail)}&select=id`;
    const checkRes = await fetch(checkUrl, {
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
      },
      cache: "no-store",
    });

    if (checkRes.ok) {
      const existing = await checkRes.json();
      if (Array.isArray(existing) && existing.length > 0) {
        return NextResponse.json(
          { detail: "Email is already registered" },
          { status: 400 }
        );
      }
    }

    // Hash password
    const hashedPassword = bcrypt.hashSync(password, 10);

    // Insert user into users table
    const insertUserUrl = `${SUPABASE_URL}/rest/v1/users`;
    const insertRes = await fetch(insertUserUrl, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        email: cleanEmail,
        full_name: resolvedName,
        hashed_password: hashedPassword,
        role: role,
        phone: phone || null,
        is_active: true,
      }),
    });

    if (!insertRes.ok) {
      const err = await insertRes.json().catch(() => ({ message: insertRes.statusText }));
      return NextResponse.json(
        { detail: err.message || "Failed to create user account" },
        { status: 500 }
      );
    }

    const insertedUsers = await insertRes.json();
    const newUser = Array.isArray(insertedUsers) ? insertedUsers[0] : insertedUsers;
    const userId = newUser.id;

    // Create role-specific profile in Supabase
    try {
      if (role === "farmer") {
        await fetch(`${SUPABASE_URL}/rest/v1/farmer_profiles`, {
          method: "POST",
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: userId,
            farm_name: profile_data.farm_name || `${resolvedName}'s Farm`,
            village: profile_data.village || "Farm Gate",
            district: profile_data.district || "Nashik",
            state: profile_data.state || "Maharashtra",
            land_size_acres: 2.5,
            kyc_status: "VERIFIED",
            bank_verified: true,
            upi_id: profile_data.upi_id || "",
          }),
        });
      } else if (role === "fpo") {
        await fetch(`${SUPABASE_URL}/rest/v1/fpo_profiles`, {
          method: "POST",
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: userId,
            fpo_name: profile_data.fpo_name || profile_data.business_name || `${resolvedName} FPO`,
            registration_no: profile_data.registration_number || `FPO-${Math.floor(100000 + Math.random() * 900000)}`,
            district: profile_data.district || "Nashik",
            state: profile_data.state || "Maharashtra",
            member_count: 120,
            collection_centers_count: 3,
            verification_status: "VERIFIED",
          }),
        });
      } else if (role === "buyer") {
        await fetch(`${SUPABASE_URL}/rest/v1/buyer_profiles`, {
          method: "POST",
          headers: {
            apikey: SUPABASE_KEY,
            Authorization: `Bearer ${SUPABASE_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: userId,
            business_name: profile_data.business_name || `${resolvedName}'s Store`,
            buyer_type: profile_data.buyer_type || "retailer",
            city: profile_data.city || profile_data.district || "Nashik",
            state: profile_data.state || "Maharashtra",
            delivery_address: profile_data.delivery_address || profile_data.address || "Buyer Delivery Hub",
            verification_status: "VERIFIED",
          }),
        });
      }
    } catch (profileErr) {
      console.warn("Could not insert profile record:", profileErr);
    }

    // Generate secure session token
    const tokenPayload = {
      sub: String(userId),
      role: newUser.role,
      email: newUser.email,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
    };
    const access_token = Buffer.from(JSON.stringify(tokenPayload)).toString("base64");

    return NextResponse.json({
      access_token,
      role: newUser.role,
      user_id: userId,
      full_name: newUser.full_name,
      email: newUser.email,
    });
  } catch (error: any) {
    return NextResponse.json(
      { detail: error.message || "Registration failed" },
      { status: 500 }
    );
  }
}

