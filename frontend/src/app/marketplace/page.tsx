"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function MarketplaceRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/shop");
  }, [router]);

  return (
    <div className="p-12 text-center text-sm text-slate-500">
      Redirecting to Consumer & Retail Shop...
    </div>
  );
}
