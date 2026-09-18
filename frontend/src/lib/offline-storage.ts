// Browser-native offline storage and synchronisation utility
const OFFLINE_KEY = "f2m_offline_listings";

export interface OfflineListing {
  id: string;
  produce_name: string;
  category: string;
  quantity_available: number;
  unit: string;
  grade: string;
  price_per_unit: number;
  location_name: string;
  district: string;
  created_at: string;
  synced: boolean;
}

export function saveOfflineListing(data: any): OfflineListing {
  const current = getOfflineListings();
  const newItem: OfflineListing = {
    id: `local-${Date.now()}`,
    produce_name: data.produce_name,
    category: data.category || "Vegetable",
    quantity_available: Number(data.quantity_available),
    unit: data.unit || "kg",
    grade: data.grade || "A",
    price_per_unit: Number(data.price_per_unit),
    location_name: data.location_name || "Pimpalgaon Farm",
    district: data.district || "Nashik",
    created_at: new Date().toISOString(),
    synced: false
  };

  current.push(newItem);
  if (typeof window !== "undefined") {
    localStorage.setItem(OFFLINE_KEY, JSON.stringify(current));
  }
  return newItem;
}

export function getOfflineListings(): OfflineListing[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(OFFLINE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearSyncedListings() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(OFFLINE_KEY);
  }
}

