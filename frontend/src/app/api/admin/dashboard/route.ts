import { NextResponse } from "next/server";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://optghlauklftecyjowqa.supabase.co";
const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.SUPABASE_PUBLISHABLE_KEY ||
  "sb_publishable_t2vDCNHb3ubXlJ6Ct2ZqZg_-6BfgA2y";

export async function GET(req: Request) {
  try {
    // 1. Try local/custom backend if configured
    const backendBase = process.env.BACKEND_URL;
    if (backendBase) {
      try {
        const backendRes = await fetch(`${backendBase.replace(/\/+$/, "")}/api/admin/dashboard`, {
          cache: "no-store",
        });
        if (backendRes.ok) {
          const data = await backendRes.json();
          return NextResponse.json(data);
        }
      } catch {
        // Backend not reachable, proceed to direct Supabase query
      }
    }

    const headers = {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
    };

    // 2. Query Supabase directly
    const [usersRes, farmerProfilesRes, fpoProfilesRes, listingsRes, ordersRes] = await Promise.all([
      fetch(`${SUPABASE_URL}/rest/v1/users?select=*&order=created_at.desc`, { headers, cache: "no-store" }).catch(() => null),
      fetch(`${SUPABASE_URL}/rest/v1/farmer_profiles?select=*`, { headers, cache: "no-store" }).catch(() => null),
      fetch(`${SUPABASE_URL}/rest/v1/fpo_profiles?select=*`, { headers, cache: "no-store" }).catch(() => null),
      fetch(`${SUPABASE_URL}/rest/v1/produce_listings?select=*,user:users(id,full_name,email)&order=created_at.desc`, { headers, cache: "no-store" }).catch(() => null),
      fetch(`${SUPABASE_URL}/rest/v1/orders?select=*,buyer:users(id,full_name)&order=created_at.desc`, { headers, cache: "no-store" }).catch(() => null),
    ]);

    const allUsers: any[] = usersRes && usersRes.ok ? await usersRes.json() : [];
    const farmerProfiles: any[] = farmerProfilesRes && farmerProfilesRes.ok ? await farmerProfilesRes.json() : [];
    const fpoProfiles: any[] = fpoProfilesRes && fpoProfilesRes.ok ? await fpoProfilesRes.json() : [];
    const produceListings: any[] = listingsRes && listingsRes.ok ? await listingsRes.json() : [];
    const orders: any[] = ordersRes && ordersRes.ok ? await ordersRes.json() : [];

    // Map profiles by user_id
    const farmerProfileMap = new Map<number, any>();
    for (const fp of farmerProfiles) {
      farmerProfileMap.set(fp.user_id, fp);
    }
    const fpoProfileMap = new Map<number, any>();
    for (const fpo of fpoProfiles) {
      fpoProfileMap.set(fpo.user_id, fpo);
    }

    // Role filtering & metrics
    const farmers = allUsers.filter((u) => u.role === "farmer");
    const fpos = allUsers.filter((u) => u.role === "fpo");
    const buyers = allUsers.filter((u) => u.role === "buyer");
    const drivers = allUsers.filter((u) => u.role === "driver");

    // Group produce by user_id
    const listingsByUser = new Map<number, { count: number; totalKg: number }>();
    for (const l of produceListings) {
      const curr = listingsByUser.get(l.user_id) || { count: 0, totalKg: 0 };
      curr.count += 1;
      curr.totalKg += Number(l.quantity_available || 0);
      listingsByUser.set(l.user_id, curr);
    }

    // Format farmers list
    const producerUsers = allUsers.filter((u) => (u.role === "farmer" || u.role === "fpo") && u.is_active !== false);
    const formattedFarmersList = producerUsers.map((u) => {
      const fp = farmerProfileMap.get(u.id);
      const fpo = fpoProfileMap.get(u.id);
      const userListings = listingsByUser.get(u.id) || { count: 0, totalKg: 0 };

      const farmName =
        u.role === "fpo"
          ? (fpo?.fpo_name || `${u.full_name} FPO`)
          : (fp?.farm_name || `${u.full_name}'s Farm`);

      const district = (u.role === "fpo" ? fpo?.district : fp?.district) || "Nashik";
      const upiId = fp?.upi_id || fpo?.upi_id || "demo@kisankart";
      const kycStatus = (u.role === "fpo" ? fpo?.verification_status : fp?.kyc_status) || "VERIFIED";

      return {
        id: u.id,
        full_name: u.full_name,
        email: u.email,
        phone: u.phone || "Not Provided",
        role: u.role,
        farm_name: farmName,
        village: fp?.village || "Farm Gate",
        district: district,
        state: fp?.state || fpo?.state || "Maharashtra",
        upi_id: upiId,
        land_size_acres: fp?.land_size_acres || (u.role === "fpo" ? 120 : 2.5),
        kyc_status: kycStatus,
        listings_count: userListings.count,
        total_produce_kg: userListings.totalKg,
        created_at: u.created_at,
        is_active: u.is_active ?? true,
      };
    });

    // Format produce listings
    const formattedProduceRecords = produceListings.map((item) => ({
      id: item.id,
      user_id: item.user_id,
      farmer_name: item.user?.full_name || "Registered Producer",
      farmer_email: item.user?.email || "",
      produce_name: item.produce_name,
      category: item.category || "Vegetable",
      grade: item.grade || "A",
      quantity_available: Number(item.quantity_available || 0),
      quantity_initial: Number(item.quantity_initial || item.quantity_available || 0),
      unit: item.unit || "kg",
      price_per_unit: Number(item.price_per_unit || 0),
      total_value: Math.round(Number(item.quantity_available || 0) * Number(item.price_per_unit || 0)),
      district: item.district || "Nashik",
      location_name: item.location_name || "Farm Cluster",
      harvest_date: item.harvest_date,
      freshness_window_days: item.freshness_window_days || 5,
      status: item.status || "AVAILABLE",
      is_fpo_aggregated: Boolean(item.is_fpo_aggregated),
      created_at: item.created_at,
    }));

    // Format orders
    let totalGmv = 0;
    let totalVolume = 0;
    const formattedOrderRecords = orders.map((order) => {
      totalGmv += Number(order.total_amount || 0);
      totalVolume += Number(order.total_quantity_kg || 0);
      return {
        id: order.id,
        order_code: order.order_code,
        buyer_name: order.buyer?.full_name || "Enterprise Buyer",
        crop: order.crop,
        quantity_kg: Number(order.total_quantity_kg || 0),
        total_amount: Number(order.total_amount || 0),
        status: order.status || "CONFIRMED",
        created_at: order.created_at,
        route_assigned: false,
      };
    });

    const activeListingsCount = formattedProduceRecords.filter(
      (l) => l.status === "AVAILABLE"
    ).length;

    const totalInventoryKg = formattedProduceRecords.reduce(
      (sum, l) => sum + (l.status === "AVAILABLE" ? l.quantity_available : 0),
      0
    );

    return NextResponse.json({
      total_farmers: farmers.length,
      total_fpos: fpos.length,
      total_buyers: buyers.length,
      total_drivers: drivers.length,
      active_orders: orders.length,
      active_listings: activeListingsCount || formattedProduceRecords.length,
      total_volume_kg: totalInventoryKg || totalVolume,
      total_gmv: totalGmv,
      active_routes: 0,
      regional_gaps: [],
      demand_analysis: [],
      route_records: [],
      order_records: formattedOrderRecords,
      farmers_list: formattedFarmersList,
      produce_listings: formattedProduceRecords,
    });
  } catch (error: any) {
    return NextResponse.json(
      { detail: error.message || "Failed to load admin dashboard data" },
      { status: 500 }
    );
  }
}

