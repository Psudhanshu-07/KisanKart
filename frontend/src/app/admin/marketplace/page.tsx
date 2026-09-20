"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminMarketplaceRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/dashboard?tab=produce");
  }, [router]);

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center space-y-3">
      <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-xs font-semibold text-slate-500">Loading Real-time Marketplace Inventory...</p>
    </div>
  );
}
